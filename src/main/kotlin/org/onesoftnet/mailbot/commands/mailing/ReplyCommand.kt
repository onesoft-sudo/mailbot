package org.onesoftnet.mailbot.commands.mailing

import dev.kord.common.Color
import dev.kord.core.behavior.reply
import dev.kord.rest.builder.message.embed
import kotlinx.datetime.Clock
import org.onesoftnet.mailbot.arguments.Argument
import org.onesoftnet.mailbot.arguments.StringRestArgument
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.core.Command
import org.onesoftnet.mailbot.core.Context
import org.onesoftnet.mailbot.mailing.MailMessageType
import org.onesoftnet.mailbot.models.MailMessage

class ReplyCommand(application: Application) : Command(application) {
    override val name = "reply"
    override val description = "Reply to a mailing list"
    override val usage = "reply <mailing-list> <message>"
    override val aliases = listOf("r", "a", "respond", "arespond", "ar")
    override val arguments = listOf(StringRestArgument::class)
    override val optionalsAfter = arguments.size
    override val mailOnly = true

    override suspend fun build() {}

    override suspend fun execute(context: Context<out Any>, args: List<Argument<out Any>>) {
        if (context !is Context.Legacy) {
            TODO()
        }

        val mail = getMailThread(context)
        val content = args.first().transformedValue as String
        val anonymous = context.commandName.startsWith("a")
        val contextName = if (anonymous) "Staff" else context.member.tag
        val contextAvatar =
            if (anonymous)
                application.kord.getSelf().avatar?.cdnUrl?.toUrl()
            else
                context.member.avatar?.cdnUrl?.toUrl()

        mail.reply(application) {
            this.content = content
            userId = context.member.id.toString()
            type = MailMessageType.STAFF_REPLY
            attributes = MailMessage.Attributes(
                anonymous = anonymous
            )

            val message = sendToUser {
                embed {
                    author {
                        name = contextName
                        icon = contextAvatar
                    }

                    description = content
                    color = Color(0x007bff)
                    timestamp = Clock.System.now()

                    footer {
                        text = "Received"
                    }
                }
            }

            if (message == null) {
                context.handle.message.reply {
                    this.content = ":x: Failed to send message to the user."
                }

                return@reply null
            }

            messageId = message.id.toString()
            build()
        }

        context.handle.message.reply {
            embed {
                author {
                    name = contextName
                    icon = contextAvatar
                }

                description = content
                color = Color(0x007bff)
                timestamp = Clock.System.now()

                footer {
                    text = "#${mail.messages + 1} • ${if (anonymous) "Anonymous" else "Normal"} Reply"
                }
            }
        }
    }
}