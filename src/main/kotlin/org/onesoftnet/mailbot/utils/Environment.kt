package org.onesoftnet.mailbot.utils

import io.github.cdimascio.dotenv.dotenv

object Environment {
    private val env = dotenv {
        ignoreIfMissing = true
    }
    private val customEnv = mutableMapOf<String, String>()

    fun getOrFail(name: String) =
        get(name)
            ?: throw Exception("No environment variable \"$name\" was found!")

    fun set(key: String, value: String) {
        customEnv[key] = value
    }

    operator fun get(s: String): String? {
        return customEnv[s] ?: env[s] ?: System.getenv(s)
    }
}