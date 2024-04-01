package org.onesoftnet.mailbot.core

import dev.kord.cache.map.MapLikeCollection
import dev.kord.cache.map.internal.MapEntryCache
import dev.kord.cache.map.lruLinkedHashMap
import dev.kord.common.entity.PresenceStatus
import dev.kord.core.Kord
import dev.kord.core.enableEvents
import dev.kord.core.entity.Guild
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.gateway.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.util.reflect.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.ktorm.database.Database
import org.onesoftnet.mailbot.annotations.Service
import org.onesoftnet.mailbot.utils.Environment
import org.slf4j.LoggerFactory
import kotlin.reflect.KClass
import kotlin.system.exitProcess


val applicationScope = CoroutineScope(Dispatchers.Default)

class Application(val kord: Kord) {
    private val loader = DynamicLoader(this)
    private val services = mutableMapOf<KClass<out AbstractService>, AbstractService>()
    private val serviceNames = mutableMapOf<String, AbstractService>()
    private var mainGuild: Guild? = null
    private val commands = mutableMapOf<String, Command>()

    val database = Database.connect(
        url = Environment.getOrFail("DB_URL"),
        driver = "org.postgresql.Driver",
        user = Environment.getOrFail("DB_USER"),
        password = Environment.getOrFail("DB_PASSWORD"),
    )

    companion object {
        private var _instance: Application? = null
        val instance: Application
            get() {
                if (_instance == null) {
                    throw IllegalStateException("Application has not been created yet!")
                }

                return _instance!!
            }
        val kord get() = instance.kord

        private val logger = LoggerFactory.getLogger(Application::class.java)

        suspend fun create(): Application {
            if (Environment["CREDENTIAL_SERVER"] != null && !fetchCredentials()) {
                exitProcess(1)
            }

            val kord = Kord(Environment.getOrFail("BOT_TOKEN")) {
                cache {
                    users { cache, description ->
                        MapEntryCache(cache, description, MapLikeCollection.concurrentHashMap())
                    }

                    messages { cache, description ->
                        MapEntryCache(cache, description, MapLikeCollection.lruLinkedHashMap(maxSize = 100))
                    }

                    channels { cache, description ->
                        MapEntryCache(cache, description, MapLikeCollection.concurrentHashMap())
                    }
                }
            }

            _instance = Application(kord)
            return instance
        }

        private suspend fun fetchCredentials(): Boolean {
            print("Enter 2FA code for the credentials server: ")

            val code = readln()
            val is2FACode = code.length == 6 && code.all { it.isDigit() }
            val client = HttpClient(CIO) {
                expectSuccess = true
                install(ContentNegotiation) {
                    json(
                        Json {
                            prettyPrint = true
                            isLenient = true
                        }
                    )
                }
            }

            try {
                val response = client.get {
                    url(Environment.getOrFail("CREDENTIAL_SERVER"))
                    headers {
                        if (is2FACode) {
                            append("X-2FA-code", code)
                        }
                        else {
                            bearerAuth(code)
                        }
                    }
                }

                if (response.status != HttpStatusCode.OK) {
                    logger.error("Failed to fetch credentials: Server responded with ${response.status}")
                    return false
                }

                val data = response.body<CredentialResponse>()

                if (!data.success) {
                    logger.error("Failed to fetch credentials")
                    return false
                }

                data.config.forEach { (key, value) ->
                    Environment.set(key.replace("^__MAILBOT_".toRegex(), ""), value)
                }

                logger.info("Fetched credentials successfully")
            }
            catch (e: ResponseException) {
                logger.error("Failed to fetch credentials: ${e.response.status}")
                return false
            }
            finally {
                client.close()
            }

            return true
        }
    }

    fun boot() {
        loader.loadServices()
        loader.loadEvents()
        loader.loadCommands()
    }

    fun <T : AbstractService> registerService(instance: T) {
        val annotation = instance::class.annotations.find { it.instanceOf(Service::class) } as Service?
        val name = annotation?.name ?: instance::class.simpleName ?: return
        serviceNames[name] = instance
        services[instance::class] = instance
    }

    @Suppress("UNCHECKED_CAST")
    fun <T : AbstractService> service(clazz: KClass<T>): T {
        return services[clazz] as T
    }

    suspend fun getMainGuild(): Guild {
        if (mainGuild == null) {
            mainGuild = kord.guilds.first {
                it.id.toString() == Environment.getOrFail("MAIN_GUILD_ID")
            }
        }

        return mainGuild ?: throw IllegalStateException("Main guild not found!")
    }

    suspend fun run() {
        kord.login {
            presence {
                status = PresenceStatus.Online
                playing("DM me to contact staff!")
            }

            intents {
                @OptIn(PrivilegedIntent::class)
                intents += Intents.PRIVILEGED + Intents.ALL + Intents(
                    Intent.GuildMessages,
                    Intent.GuildMembers,
                    Intent.DirectMessages,
                    Intent.MessageContent,
                    Intent.Guilds,
                )

                enableEvents(MessageCreateEvent::class)
            }
        }
    }

    fun addCommand(command: Command) {
        commands[command.name] = command

        command.aliases.forEach {
            commands[it] = command
        }
    }

    fun resolveCommand(name: String): Command? {
        return commands[name]
    }

    @Serializable
    private data class CredentialResponse(
        val success: Boolean,
        val config: Map<String, String>
    )
}