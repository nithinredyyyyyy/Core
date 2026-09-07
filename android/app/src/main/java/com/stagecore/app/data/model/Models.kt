package com.stagecore.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Tournament(
    val id: String,
    val name: String,
    val game: String,
    val imageUrl: String,
    val status: String,
    val prizePool: String? = null
)

@Serializable
data class Match(
    val id: String,
    val team1: Team,
    val team2: Team,
    val time: String,
    val status: String,
    val tournamentName: String? = null
)

@Serializable
data class Team(
    val id: String,
    val name: String,
    val logoUrl: String,
    val score: Int? = null
)

@Serializable
data class News(
    val id: String,
    val title: String,
    val content: String,
    val imageUrl: String,
    val date: String
)

@Serializable
data class HomeView(
    val featuredTournament: Tournament? = null,
    val upcomingMatches: List<Match> = emptyList(),
    val latestNews: List<News> = emptyList()
)
