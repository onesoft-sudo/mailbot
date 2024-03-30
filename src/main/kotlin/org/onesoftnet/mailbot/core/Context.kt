package org.onesoftnet.mailbot.core

import dev.kord.core.entity.Member
import dev.kord.core.entity.User
import dev.kord.core.event.message.MessageCreateEvent
import org.onesoftnet.mailbot.utils.Environment

sealed class Context<T>(val application: Application, val handle: T) {
    abstract val type: Type
    abstract val user: User
    abstract val member: Member?


    enum class Type {
        LEGACY,
        CHAT_INPUT
    }

    class Legacy(application: Application, handle: MessageCreateEvent, val argv: List<String>, val args: List<String>) : Context<MessageCreateEvent>(application, handle) {
        override val type = Type.LEGACY
        override val user
            get() = handle.message.author ?: error("Author is null")
        override val member
            get() = handle.member ?: error("Member is null")
        val prefix = Environment.getOrFail("BOT_PREFIX")
    }
}