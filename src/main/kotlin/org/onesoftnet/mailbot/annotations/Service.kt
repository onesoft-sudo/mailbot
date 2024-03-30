package org.onesoftnet.mailbot.annotations

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.CLASS)
annotation class Service(
    val name: String = ""
)