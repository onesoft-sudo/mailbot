package org.onesoftnet.mailbot.arguments

import org.onesoftnet.mailbot.core.Context

abstract class Argument<T>(open val context: Context.Legacy, val position: Int, val optional: Boolean) {
    val transformedValue: T by lazy {
        val value = transform()
        validate(value)
        value
    }

    fun tryTransform(): Pair<T?, ArgumentValidationException?> {
        return try {
            val transformed = transform()
            validate(transformed)
            Pair(transformed, null)
        } catch (e: ArgumentValidationException) {
            Pair(null, e)
        }
    }

    protected fun error(message: String): Nothing {
        throw ArgumentValidationException(message)
    }

    protected fun argumentValue(position: Int = this.position): String? {
        return if (context.args.size > position) context.args[position] else null
    }

    abstract fun validate(value: T): Unit
    abstract fun transform(): T
}