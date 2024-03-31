package org.onesoftnet.mailbot.services

import dev.kord.common.Color
import dev.kord.common.entity.Snowflake
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.behavior.createTextChannel
import dev.kord.core.behavior.getChannelOfOrNull
import dev.kord.core.behavior.reply
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.TextChannel
import dev.kord.rest.builder.message.embed
import kotlinx.datetime.Clock
import org.ktorm.dsl.*
import org.onesoftnet.mailbot.annotations.Service
import org.onesoftnet.mailbot.core.AbstractService
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.mailing.MailChecker
import org.onesoftnet.mailbot.mailing.MailMessageType
import org.onesoftnet.mailbot.models.Mail
import org.onesoftnet.mailbot.tables.MailMessages
import org.onesoftnet.mailbot.tables.Mails
import org.onesoftnet.mailbot.utils.EmbedUtils
import org.onesoftnet.mailbot.utils.Environment

@Service
class MailService(application: Application) : AbstractService(application) {
    val mailCategory = Environment.getOrFail("MAIL_CATEGORY_ID")

    suspend fun check(userId: String, block: suspend MailChecker.() -> Unit) {
        val mailChecker = MailChecker(application, userId)
        mailChecker.check()
        mailChecker.block()
    }

    fun getMailByChannelId(channelId: String) = application.database.from(Mails)
        .select(Mails.columns)
        .where { Mails.channelId eq channelId }
        .map { Mails.createEntity(it) }
        .firstOrNull()

    private suspend fun sendInitialMessage(threadId: Int, channel: TextChannel, user: User, createdBy: User = user) {
        channel.createMessage {
            embed {
                author {
                    name = user.username
                    icon = user.avatar?.cdnUrl?.toUrl()
                }

                title = "New Thread Created"
                description = "This is the beginning of the thread conversation."
                color = Color(0x007bff)
                timestamp = Clock.System.now()

                field {
                    name = "User"
                    value = EmbedUtils.userInfo(user)
                    inline = true
                }

                if (user.id != createdBy.id) {
                    field {
                        name = "Created By"
                        value = EmbedUtils.userInfo(createdBy)
                        inline = true
                    }
                }

                field {
                    name = "Thread ID"
                    value = threadId.toString()
                }

                footer {
                    text = "Created"
                }
            }
        }
    }

    suspend fun create(user: User, createdBy: User = user): Int {
        val guild = application.getMainGuild()
        val channel = guild.createTextChannel(user.username) {
            parentId = Snowflake(mailCategory)
            topic = "Mail thread for ${user.username} (<@${user.id}>)"
        }

        val id = application.database.insert(Mails) {
            set(it.userId, user.id.toString())
            set(it.channelId, channel.id.toString())
        }

        sendInitialMessage(
            threadId = id,
            channel = channel,
            user = user,
            createdBy = createdBy
        )

        return id
    }

    suspend fun respondToMailCreation(event: dev.kord.core.event.message.MessageCreateEvent) {
        val guild = application.getMainGuild()

        event.message.reply {
            embed {
                title = "Thread Created!"
                description = "Thank you for using MailBot! Your message has been sent successfully.\n" +
                              "Our staff team will get back to you shortly."
                color = Color(0x007bff)
                timestamp = Clock.System.now()

                footer {
                    text = "Any messages further sent in this DM will be sent to our staff team"
                    icon = guild.icon?.cdnUrl?.toUrl()
                }
            }
        }
    }

    suspend fun forwardUserMessage(event: dev.kord.core.event.message.MessageCreateEvent, mail: Mail) {
        val guild = application.getMainGuild()
        val channel = guild.getChannelOfOrNull<TextChannel>(Snowflake(mail.channelId))

        channel?.apply {
            val message = createMessage {
                embed {
                    author {
                        name = event.message.author?.username ?: "Unknown User"
                        icon = event.message.author?.avatar?.cdnUrl?.toUrl()
                    }

                    description = event.message.content
                    color = Color(0x007bff)
                    timestamp = Clock.System.now()

                    footer {
                        text = "#${mail.messages + 1} • Received • ${event.message.author?.id}"
                    }
                }
            }

            application.database.insert(MailMessages) {
                set(it.userId, event.message.author?.id?.toString() ?: throw IllegalStateException("User ID not found"))
                set(it.threadId, mail.id)
                set(it.messageId, message.id.toString())
                set(it.content, event.message.content)
                set(it.serialNumber, mail.messages + 1)
                set(it.type, MailMessageType.USER_REPLY.value)
            }

            application.database.update(Mails) {
                set(it.messages, mail.messages + 1)
                where {
                    it.id eq mail.id
                }
            }
        }
    }
}