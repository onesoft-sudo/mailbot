package org.onesoftnet.mailbot.events

import dev.kord.core.event.gateway.ReadyEvent
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.core.EventListener
import org.slf4j.LoggerFactory

class ReadyEvent(application: Application) : EventListener<ReadyEvent>(application) {
    override val eventType = ReadyEvent::class
    private val logger = LoggerFactory.getLogger(this.javaClass)

    override suspend fun onEvent(event: ReadyEvent) {
        logger.info("Logged in as @${event.kord.getSelf().username}")
    }
}