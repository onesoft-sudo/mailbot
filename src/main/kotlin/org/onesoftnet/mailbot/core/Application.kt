package org.onesoftnet.mailbot.core

import dev.kord.cache.map.MapLikeCollection
import dev.kord.cache.map.internal.MapEntryCache
import dev.kord.cache.map.lruLinkedHashMap
import dev.kord.common.entity.PresenceStatus
import dev.kord.core.Kord
import dev.kord.core.enableEvents
import dev.kord.gateway.Intent
import dev.kord.gateway.Intents
import dev.kord.gateway.PRIVILEGED
import dev.kord.gateway.PrivilegedIntent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import org.ktorm.database.Database
import org.onesoftnet.mailbot.utils.Environment


val applicationScope = CoroutineScope(Dispatchers.Default)

class Application(val kord: Kord) {
    val loader = DynamicLoader(this)
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
                }

            }

            return Application(kord)
        }
    }

    fun boot() {
        loader.loadEvents()
    }

    suspend fun run() {
        kord.login {
            presence {
                status = PresenceStatus.Online
                playing("DM me to contact staff!")
            }

            intents {
                @OptIn(PrivilegedIntent::class)
                intents += Intents(
                    Intent.GuildMessages,
                    Intent.GuildMembers,
                    Intent.DirectMessages,
                    Intent.MessageContent,
                    Intent.Guilds,
                )
                enableEvents(dev.kord.core.event.message.MessageCreateEvent::class)
            }
        }
    }
}