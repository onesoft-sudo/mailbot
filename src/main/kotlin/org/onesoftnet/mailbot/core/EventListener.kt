package org.onesoftnet.mailbot.core

import dev.kord.core.event.Event
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.buffer
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import kotlin.reflect.KClass

abstract class EventListener<T : Event>(protected val application: Application) {
    abstract val eventType: KClass<T>

    open fun boot() {}

    fun register(application: Application) {
        val logger = LoggerFactory.getLogger(this.javaClass)

        application.kord.events
            .buffer(Channel.UNLIMITED)
            .filter { eventType.isInstance(it) }
            .onEach { event ->
                applicationScope
                    .launch {
                        runCatching {
                            @Suppress("UNCHECKED_CAST")
                            onEvent(event as T)
                        }
                        .onFailure {
                            logger.error("An error has occurred", it)
                        }
                    }
            }
            .launchIn(applicationScope)
    }

    abstract suspend fun onEvent(event: T)
}