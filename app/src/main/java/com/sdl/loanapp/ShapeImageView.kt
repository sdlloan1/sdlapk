package com.sdl.loanapp

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.view.View
import kotlin.math.max
import kotlin.math.min

/** Draws a logo inside a circle, rounded square or square, cropped or whole. */
class ShapeImageView(context: Context) : View(context) {

    private var bitmap: Bitmap? = null
    private var shape = "rounded"
    private var fit = "cover"

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { isFilterBitmap = true }
    private val path = Path()
    private val matrix = Matrix()
    private val bounds = RectF()

    fun setImage(value: Bitmap?) {
        bitmap = value
        invalidate()
    }

    fun setShape(value: String) {
        shape = value
        invalidate()
    }

    fun setFit(value: String) {
        fit = value
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        val image = bitmap ?: return
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0f || h <= 0f || image.width == 0 || image.height == 0) return

        path.reset()
        when (shape) {
            "circle" -> path.addCircle(w / 2f, h / 2f, min(w, h) / 2f, Path.Direction.CW)
            "square" -> {
                bounds.set(0f, 0f, w, h)
                path.addRect(bounds, Path.Direction.CW)
            }
            else -> {
                val radius = min(w, h) * 0.22f
                bounds.set(0f, 0f, w, h)
                path.addRoundRect(bounds, radius, radius, Path.Direction.CW)
            }
        }

        val scale =
            if (fit == "contain") min(w / image.width, h / image.height)
            else max(w / image.width, h / image.height)

        matrix.reset()
        matrix.setScale(scale, scale)
        matrix.postTranslate(
            (w - image.width * scale) / 2f,
            (h - image.height * scale) / 2f
        )

        paint.shader = BitmapShader(image, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP).apply {
            setLocalMatrix(matrix)
        }
        canvas.drawPath(path, paint)
    }
}
