package com.stagecore.app.ui.components

import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.viewinterop.AndroidView
import com.stagecore.app.ui.theme.StageCoreTheme

@Composable
fun StageCoreWebView(
    url: String,
    modifier: Modifier = Modifier,
    onBackAvailable: (Boolean) -> Unit = {}
) {
    AndroidView(
        modifier = modifier,
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.databaseEnabled = true
                settings.loadWithOverviewMode = true
                settings.useWideViewPort = true
                
                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        return false
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        onBackAvailable(view?.canGoBack() ?: false)
                    }
                }
                loadUrl(url)
            }
        },
        update = { webView ->
            // Update the WebView if needed when Compose state changes
        }
    )
}

@Preview(showBackground = true)
@Composable
fun StageCoreWebViewPreview() {
    StageCoreTheme {
        StageCoreWebView(url = "https://example.com")
    }
}
