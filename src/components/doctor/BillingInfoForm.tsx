
"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function BillingInfoForm({ isSubmitting }: { isSubmitting: boolean }) {
  const { control, setValue, clearErrors, watch } = useFormContext();
  const paymentMethod = watch("billingInfo.type");

  return (
    <Card>
        <CardHeader>
            <CardTitle>Datos de Facturación</CardTitle>
            <CardDescription>
                Ingresa tus datos bancarios para recibir los pagos por tus servicios. Esta información es confidencial y obligatoria para que tu perfil sea aprobado.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-6 max-w-lg">
                <FormField
                    control={control}
                    name="billingInfo.type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Método de Pago</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value);
                                setValue('billingInfo.value', ''); 
                                clearErrors('billingInfo.value');
                            }}
                            value={field.value}
                            className="flex flex-col space-y-1"
                            disabled={isSubmitting}
                            >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="cbu" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    CBU (Clave Bancaria Uniforme)
                                </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="alias" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    Alias
                                </FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="billingInfo.value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{paymentMethod === 'cbu' ? 'CBU' : 'Alias'}</FormLabel>
                            <FormControl>
                                <Input 
                                    {...field} 
                                    disabled={isSubmitting} 
                                    placeholder={paymentMethod === 'cbu' ? '0000000000000000000000' : 'mi.alias.mp'}
                                />
                            </FormControl>
                            <FormDescription>
                                {paymentMethod === 'cbu' 
                                    ? 'Ingresa los 22 dígitos de tu CBU.' 
                                    : 'Ingresa tu alias de entre 3 y 20 caracteres.'
                                }
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </CardContent>
    </Card>
  );
}
