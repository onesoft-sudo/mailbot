package org.onesoftnet.mailbot.arguments

import org.onesoftnet.mailbot.core.Context

class StringArgument(override val context: Context.Legacy, position: Int, optional: Boolean) : Argument<String?>(context, position, optional) {
    override fun validate(value: String?) {
        if (!optional && value.isNullOrEmpty()) {
            throw ArgumentValidationException("Argument at position $position is required!")
        }
    }

    override fun transform(): String {
        return argumentValue() ?: error("Argument at position $position is required!")
    }
}