package com.stagecore.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF00FF85), // Neon Green
    secondary = Color(0xFF7C4DFF), // Deep Purple
    tertiary = Color(0xFF03DAC6),
    background = Color(0xFF0A0A0A),
    surface = Color(0xFF161616),
    onPrimary = Color.Black,
    onSecondary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = Color(0xFF242424)
)

@Composable
fun StageCoreTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // We only use dark theme for Esports aesthetic
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
