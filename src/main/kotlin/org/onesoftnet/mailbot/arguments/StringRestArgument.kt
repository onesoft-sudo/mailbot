package org.onesoftnet.mailbot.arguments

import org.onesoftnet.mailbot.core.Context

class StringRestArgument(override val context: Context.Legacy, position: Int, optional: Boolean) : Argument<String?>(context, position, optional) {
    override fun validate(value: String?) {
        if (!optional && value.isNullOrEmpty()) {
            throw ArgumentValidationException("Argument at position $position is required!")
        }
    }

    override fun transform(): String {
        var content = context.handle.message.content
            .removePrefix(context.prefix)
            .removePrefix(context.argv[0])

        for (i in 0 until position) {
            content = content.removePrefix(context.args[i])
        }

        return content
    }
}