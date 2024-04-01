package org.onesoftnet.mailbot.commands.mailing

import org.onesoftnet.mailbot.arguments.Argument
import org.onesoftnet.mailbot.arguments.StringRestArgument
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.core.Command
import org.onesoftnet.mailbot.core.Context

class CloseCommand(application: Application) : Command(application) {
    override val name = "close"
    override val description = "Closes a mail thread"
    override val usage = "<duration>"
    override val aliases = listOf("c")
    override val mailOnly = true

    override suspend fun build() {
        TODO("Not yet implemented")
    }

    override suspend fun execute(context: Context<out Any>, args: List<Argument<out Any>>) {
        if (context !is Context.Legacy) {
            TODO()
        }

        closeCurrentMailThread(context) {
            context.reply {
                content = "Closing thread..."
            }
        }
    }
}