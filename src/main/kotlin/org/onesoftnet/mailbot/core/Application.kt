package org.onesoftnet.mailbot.core

import dev.kord.cache.map.MapLikeCollection
import dev.kord.cache.map.internal.MapEntryCache
import dev.kord.cache.map.lruLinkedHashMap
import dev.kord.common.entity.PresenceStatus
import dev.kord.core.Kord
import dev.kord.core.enableEvents
import dev.kord.core.entity.Guild
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.core.on
import dev.kord.gateway.*
import io.ktor.util.reflect.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import org.ktorm.database.Database
import org.onesoftnet.mailbot.annotations.Service
import org.onesoftnet.mailbot.utils.Environment
import kotlin.reflect.KClass


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
        suspend fun create(): Application {
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

            return Application(kord)
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
}