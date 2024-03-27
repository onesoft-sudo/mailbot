package org.onesoftnet.mailbot.core

import dev.kord.core.Kord
import dev.kord.core.event.Event
import kotlinx.coroutines.*
import kotlin.reflect.KClass

abstract class EventListener<T : Event> {
    protected lateinit var application: Application
    abstract val eventType: KClass<T>

    open fun boot(application: Application) {}

    fun register(application: Application) {
        this@EventListener.application = application

        applicationScope.launch {
            application.kord.events.collect {
                if (eventType.isInstance(it)) {
                    @Suppress("UNCHECKED_CAST")
                    handler(it as T)
                }
            }
        }
    }

    abstract suspend fun handler(event: T)
}