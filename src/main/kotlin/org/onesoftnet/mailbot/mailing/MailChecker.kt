package org.onesoftnet.mailbot.mailing

import dev.kord.core.entity.User
import dev.kord.rest.builder.message.create.MessageCreateBuilder
import org.ktorm.dsl.*
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.models.Mail
import org.onesoftnet.mailbot.services.MailService
import org.onesoftnet.mailbot.tables.Mails

class MailChecker(private val application: Application, private val userId: String) {
    private var entity: Mail? = null

    suspend fun ifFound(block: suspend (Mail) -> Unit) {
        entity?.let { block(it) }
    }

    suspend fun ifNotFound(block: suspend () -> Unit) {
        if (entity == null)
            block()
    }

    fun check() {
        application.database
            .from(Mails)
            .select(Mails.columns)
            .where { Mails.userId eq userId }
            .limit(1)
            .map { entity = Mails.createEntity(it) }
            .ifEmpty { entity = null }
    }

    suspend fun createMail(user: User, block: (MessageCreateBuilder.() -> Unit)? = null) = application.service(MailService::class).create(user, user, block)
}