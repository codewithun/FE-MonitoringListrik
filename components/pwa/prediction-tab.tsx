import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Prediction } from "./types"
import { formatCurrency } from "./types"

interface PredictionTabProps {
  prediction: Prediction | undefined
}

export function PredictionTab({ prediction }: PredictionTabProps) {
  return (
    <section className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prediksi Biaya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              {prediction?.label || "Bulan ini / bulan depan"}
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {formatCurrency(prediction?.cost ?? 0)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Estimasi energi {prediction?.energy ?? 0} kWh.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
