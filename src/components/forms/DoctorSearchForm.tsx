
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { specialties } from "@/lib/placeholder-data";
import { Search, Star } from "lucide-react";

export function DoctorSearchForm() {
  const [rating, setRating] = useState([4]);

  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="specialty">Especialidad</Label>
        <Select>
          <SelectTrigger id="specialty">
            <SelectValue placeholder="Seleccionar especialidad" />
          </SelectTrigger>
          <SelectContent>
            {specialties.map((spec) => (
              <SelectItem key={spec} value={spec.toLowerCase()}>
                {spec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rating">Calificación Mínima</Label>
        <div className="flex items-center gap-4 pt-2">
           <Slider
              id="rating"
              min={1}
              max={5}
              step={0.5}
              value={rating}
              onValueChange={setRating}
              className="flex-1"
            />
            <div className="flex items-center justify-center font-semibold w-16 h-8 rounded-md border text-sm">
                {rating[0].toFixed(1)} <Star className="ml-1.5 h-4 w-4 text-yellow-400 fill-yellow-400" />
            </div>
        </div>
      </div>
      
      <Button className="w-full">
        <Search className="mr-2 h-4 w-4"/>
        Aplicar Filtros
      </Button>
    </form>
  );
}
