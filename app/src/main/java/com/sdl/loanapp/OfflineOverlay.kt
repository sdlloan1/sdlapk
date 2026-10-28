package com.sdl.loanapp

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/** Shown when the device has no internet connection. */
@SuppressLint("ViewConstructor")
class OfflineOverlay(
    context: Context,
    offlineConfig: OfflineConfig,
    onRetry: () -> Unit
) : FrameLayout(context) {

    init {
        setBackgroundColor(Color.WHITE)

        val density = context.resources.displayMetrics.density
        fun dp(value: Int) = (value * density).toInt()

        val content = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(32), dp(32), dp(32), dp(32))
        }

        val icon = TextView(context).apply {
            text = "!"
            textSize = 22f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#B3261E"))
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#FDECEB"))
            }
        }
        content.addView(icon, LinearLayout.LayoutParams(dp(52), dp(52)))

        val title = TextView(context).apply {
            text = offlineConfig.title
            textSize = 18f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#1F1A17"))
            setTypeface(typeface, Typeface.BOLD)
        }
        content.addView(title, LinearLayout.LayoutParams(
            LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(16) })

        val message = TextView(context).apply {
            text = offlineConfig.message
            textSize = 14f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#8A7B71"))
        }
        content.addView(message, LinearLayout.LayoutParams(
            LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(6) })

        val button = TextView(context).apply {
            text = offlineConfig.buttonLabel
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            setPadding(dp(24), dp(12), dp(24), dp(12))
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#FF4D3D"), Color.parseColor("#FF994A"))
            ).apply { cornerRadius = dp(12).toFloat() }
            setOnClickListener { onRetry() }
        }
        content.addView(button, LinearLayout.LayoutParams(
            LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(22) })

        addView(content, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }
}
