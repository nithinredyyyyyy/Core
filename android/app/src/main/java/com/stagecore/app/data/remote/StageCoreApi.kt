package com.stagecore.app.data.remote

import com.stagecore.app.data.model.HomeView
import com.stagecore.app.data.model.Tournament
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.android.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

object StageCoreApi {
    private const val BASE_URL = "http://10.0.2.2:4000"

    private val client = HttpClient(Android) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                prettyPrint = true
                isLenient = true
            })
        }
    }

    suspend fun getHomeView(): HomeView {
        return client.get("$BASE_URL/api/home/view").body()
    }

    suspend fun getTournaments(): List<Tournament> {
        return client.get("$BASE_URL/api/entities/tournaments").body()
    }
}
