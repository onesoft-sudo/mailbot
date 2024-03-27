package org.onesoftnet.mailbot.utils

import io.github.cdimascio.dotenv.dotenv

object Environment {
    private val env = dotenv {
        ignoreIfMissing = true
    }

    fun getOrFail(name: String) =
        env[name]
            ?: System.getenv(name)
            ?: throw Exception("No environment variable \"$name\" was found!")
}