package org.onesoftnet.mailbot.commands.mailing

import dev.kord.core.behavior.reply
import org.onesoftnet.mailbot.arguments.Argument
import org.onesoftnet.mailbot.arguments.StringArgument
import org.onesoftnet.mailbot.arguments.StringRestArgument
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.core.Command
import org.onesoftnet.mailbot.core.Context

class ReplyCommand(application: Application) : Command(application) {
    override val name = "reply"
    override val description = "Reply to a mailing list"
    override val usage = "reply <mailing-list> <message>"
    override val aliases = listOf("r")
    override val arguments = listOf(StringRestArgument::class)
    override val optionalsAfter = arguments.size

    override suspend fun build() {}

    override suspend fun execute(context: Context<out Any>, args: List<Argument<out Any>>) {
        if (context !is Context.Legacy) {
            return
        }

        val content = args.first().transformedValue as String

        context.handle.message.reply {
            this.content = content
        }
    }
}