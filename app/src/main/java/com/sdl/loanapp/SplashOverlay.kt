package com.sdl.loanapp

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.util.Base64
import android.view.Gravity
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar

/** The configurable loading screen shown while the app starts. */
@SuppressLint("ViewConstructor")
class SplashOverlay(
    context: Context,
    private val splashConfig: SplashConfig,
    logoConfig: LogoConfig
) : FrameLayout(context) {

    private val content = LinearLayout(context)
    private val logoView = ShapeImageView(context)

    init {
        val background = parseColor(splashConfig.background, DEFAULT_BACKGROUND)
        setBackgroundColor(background)

        content.orientation = LinearLayout.VERTICAL
        content.gravity = Gravity.CENTER

        logoView.setShape(logoConfig.shape)
        logoView.setFit(logoConfig.fit)
        logoView.setImage(
            decodeLogo(logoConfig.imageUrl)
                ?: BitmapFactory.decodeResource(context.resources, R.drawable.logo)
        )

        val density = context.resources.displayMetrics.density
        val width = context.resources.displayMetrics.widthPixels
        val logoSize = minOf(width * logoConfig.sizePercent.coerceIn(15, 80) / 100f, 320f * density).toInt()
        content.addView(logoView, LinearLayout.LayoutParams(logoSize, logoSize))

        if (splashConfig.showProgress) {
            val darkBackground = Color.luminance(background) < 0.5f
            val bar = ProgressBar(context).apply {
                indeterminateTintList = ColorStateList.valueOf(
                    if (darkBackground) Color.WHITE else BRAND
                )
            }
            val params = LinearLayout.LayoutParams((36 * density).toInt(), (36 * density).toInt())
            params.topMargin = (28 * density).toInt()
            content.addView(bar, params)
        }

        addView(content, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    fun playIntro() {
        when (splashConfig.animation) {
            "fade" -> {
                content.alpha = 0f
                content.animate().alpha(1f).setDuration(450).start()
            }
            "zoom" -> {
                content.alpha = 0f
                content.scaleX = 0.78f
                content.scaleY = 0.78f
                content.animate()
                    .alpha(1f).scaleX(1f).scaleY(1f)
                    .setDuration(520)
                    .setInterpolator(DecelerateInterpolator())
                    .start()
            }
            "slide" -> {
                content.alpha = 0f
                content.translationY = 46f * resources.displayMetrics.density
                content.animate()
                    .alpha(1f).translationY(0f)
                    .setDuration(520)
                    .setInterpolator(DecelerateInterpolator())
                    .start()
            }
        }
    }

    fun dismiss() {
        animate().alpha(0f).setDuration(250).withEndAction {
            (parent as? android.view.ViewGroup)?.removeView(this)
        }.start()
    }

    private fun parseColor(value: String, fallback: Int): Int =
        try {
            Color.parseColor(value)
        } catch (e: IllegalArgumentException) {
            fallback
        }

    private fun decodeLogo(imageUrl: String): Bitmap? {
        val marker = "base64,"
        val index = imageUrl.indexOf(marker)
        if (!imageUrl.startsWith("data:") || index < 0) return null
        return try {
            val bytes = Base64.decode(imageUrl.substring(index + marker.length), Base64.DEFAULT)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        } catch (e: Exception) {
            null
        }
    }

    private companion object {
        val DEFAULT_BACKGROUND = Color.parseColor("#FFFFFF")
        val BRAND = Color.parseColor("#FF4D3D")
    }
}
