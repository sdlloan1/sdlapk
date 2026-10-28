package com.sdl.loanapp

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : Activity() {

    private lateinit var root: FrameLayout
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var configRepository: ConfigRepository
    private lateinit var notificationCenter: NotificationCenter

    private var config = AppConfig()
    private var splash: SplashOverlay? = null
    private var splashShownAt = 0L
    private var pageFinished = false
    private var offlineView: OfflineOverlay? = null
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    private val connectivity: ConnectivityManager by lazy {
        getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    }

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            runOnUiThread {
                val wasOffline = offlineView != null
                hideOffline()
                if (wasOffline) webView.loadUrl(config.startUrl)
            }
        }

        override fun onLost(network: Network) {
            runOnUiThread { showOfflineIfEnabled() }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }

        configRepository = ConfigRepository(this)
        config = configRepository.cached()
        notificationCenter = NotificationCenter(this)
        notificationCenter.ensureChannel()
        requestNotificationPermission()

        root = FrameLayout(this)

        webView = WebView(this)
        root.addView(webView, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        progressBar.max = 100
        progressBar.visibility = View.GONE
        root.addView(progressBar, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ))

        setContentView(root)

        configureWebView()
        configureWebViewClient()
        configureWebChromeClient()

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
            pageFinished = true
        } else {
            if (config.splash.enabled) showSplash(config)
            loadConfigThenStart()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadsImagesAutomatically = true
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "$userAgentString SDLAndroidApp/1.2"
        }

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }
    }

    private fun configureWebViewClient() {
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val url = req.url
                if (url.scheme == "http" || url.scheme == "https") return false
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, url)); true
                } catch (e: Exception) { false }
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                progressBar.visibility = View.VISIBLE
                hideOffline()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
                goImmersive()
                pageFinished = true
                scheduleSplashHide()
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                if (request.isForMainFrame && !hasNetwork()) showOfflineIfEnabled()
            }
        }
    }

    private fun configureWebChromeClient() {
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                progressBar.visibility = if (newProgress >= 100) View.GONE else View.VISIBLE
            }

            override fun onShowFileChooser(
                wv: WebView,
                cb: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = cb
                return try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQ)
                    true
                } catch (e: Exception) {
                    fileChooserCallback = null
                    false
                }
            }
        }
    }

    /** Fetch the dashboard settings (short timeout), then open the configured first page. */
    private fun loadConfigThenStart() {
        Thread {
            val fresh = configRepository.fetchRemote()
            notificationCenter.fetchAndShow()
            runOnUiThread {
                if (fresh != null) {
                    config = fresh
                    if (!fresh.splash.enabled) hideSplash()
                }
                webView.loadUrl(config.startUrl)
                if (splash != null) root.postDelayed({ hideSplash() }, SPLASH_TIMEOUT_MS)
            }
        }.start()
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return
        requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), NOTIFICATION_REQ)
    }

    private fun showSplash(settings: AppConfig) {
        val overlay = SplashOverlay(this, settings.splash, settings.logo)
        splash = overlay
        splashShownAt = SystemClock.elapsedRealtime()
        root.addView(overlay, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))
        overlay.playIntro()
    }

    private fun scheduleSplashHide() {
        if (splash == null) return
        val remaining = config.splash.durationMs - (SystemClock.elapsedRealtime() - splashShownAt)
        if (remaining <= 0) hideSplash()
        else root.postDelayed({
            if (pageFinished) hideSplash()
        }, remaining)
    }

    private fun hideSplash() {
        val overlay = splash ?: return
        splash = null
        overlay.dismiss()
    }

    private fun showOfflineIfEnabled() {
        if (!config.offline.enabled || offlineView != null) return
        hideSplash()
        val overlay = OfflineOverlay(this, config.offline) {
            hideOffline()
            webView.loadUrl(config.startUrl)
        }
        offlineView = overlay
        root.addView(overlay, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))
    }

    private fun hideOffline() {
        offlineView?.let { root.removeView(it) }
        offlineView = null
    }

    private fun hasNetwork(): Boolean {
        val network = connectivity.activeNetwork ?: return false
        val capabilities = connectivity.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun goImmersive() {
        WindowCompat.getInsetsController(window, window.decorView).apply {
            systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.systemBars())
        }
    }

    override fun onStart() {
        super.onStart()
        try {
            connectivity.registerDefaultNetworkCallback(networkCallback)
        } catch (e: Exception) {
            // Already registered or unavailable on this device.
        }
        if (!hasNetwork()) showOfflineIfEnabled()
    }

    override fun onStop() {
        try {
            connectivity.unregisterNetworkCallback(networkCallback)
        } catch (e: Exception) {
            // Not registered.
        }
        super.onStop()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) goImmersive()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQ) {
            fileChooserCallback?.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            )
            fileChooserCallback = null
            return
        }
        super.onActivityResult(requestCode, resultCode, data)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    companion object {
        private const val FILE_CHOOSER_REQ = 1001
        private const val NOTIFICATION_REQ = 1002
        private const val SPLASH_TIMEOUT_MS = 6000L
    }
}
