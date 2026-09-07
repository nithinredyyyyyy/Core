package com.stagecore.app.ui.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.stagecore.app.data.model.HomeView
import com.stagecore.app.data.remote.StageCoreApi
import com.stagecore.app.ui.components.StageCoreCard

@Composable
fun HomeScreen() {
    var homeView by remember { mutableStateOf<HomeView?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            homeView = StageCoreApi.getHomeView()
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            isLoading = false
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            item {
                Text(
                    "Dashboard",
                    style = MaterialTheme.typography.headlineLarge,
                    modifier = Modifier.padding(16.dp)
                )
            }

            homeView?.featuredTournament?.let { tournament ->
                item {
                    Text(
                        "Featured Tournament",
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                    StageCoreCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                    ) {
                        AsyncImage(
                            model = tournament.imageUrl,
                            contentDescription = null,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(tournament.name, style = MaterialTheme.typography.headlineSmall)
                        Text(tournament.game, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }

            item {
                Text(
                    "Upcoming Matches",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)
                )
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(homeView?.upcomingMatches ?: emptyList()) { match ->
                        StageCoreCard(modifier = Modifier.width(280.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                            ) {
                                TeamLogo(match.team1.logoUrl, match.team1.name)
                                Text("VS", style = MaterialTheme.typography.titleSmall)
                                TeamLogo(match.team2.logoUrl, match.team2.name)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(match.time, style = MaterialTheme.typography.bodySmall, modifier = Modifier.align(androidx.compose.ui.Alignment.CenterHorizontally))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TeamLogo(url: String, name: String) {
    Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
        AsyncImage(
            model = url,
            contentDescription = name,
            modifier = Modifier.size(48.dp)
        )
        Text(name, style = MaterialTheme.typography.bodySmall)
    }
}
