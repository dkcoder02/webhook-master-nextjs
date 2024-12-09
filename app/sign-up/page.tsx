'use client';

import { Button } from '@/components/ui/button'
import { useSignUp } from '@clerk/nextjs';
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClerkAPIError } from '@clerk/types'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

function SignUpPage() {
    const { isLoaded, signUp, setActive } = useSignUp()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<ClerkAPIError[]>()
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter()

    if (!isLoaded) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setErrors(undefined)

        if (!isLoaded) return;

        try {
            const completeSignUp = await signUp.create({
                emailAddress: email,
                password,
            })

            console.log('completeSignUp', completeSignUp);


            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

            setPendingVerification(true);
        } catch (err) {
            if (isClerkAPIResponseError(err)) setErrors(err.errors)
            console.error(JSON.stringify(err, null, 2))
        }
    }

    const onPressVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        setErrors(undefined)
        if (!isLoaded) return;

        try {
            const attemptEmailVerification = await signUp.attemptEmailAddressVerification({
                code,
            });


            console.log("attemptEmailVerification", attemptEmailVerification)
            if (attemptEmailVerification.status !== "complete") {
                console.log(JSON.stringify(attemptEmailVerification, null, 2));
            }

            if (attemptEmailVerification.status === "complete") {
                await setActive({ session: attemptEmailVerification.createdSessionId });
                router.push("/dashboard");
            }
        } catch (err: any) {
            if (isClerkAPIResponseError(err)) {
                setErrors(err.errors)
                console.log("err.errors", err.errors)
            }
            console.error(JSON.stringify(err, null, 2));
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        Sign Up for Todo Master
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!pendingVerification ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-500" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {errors && (
                                errors.map((el, index) => (
                                    <Alert variant="destructive">
                                        <AlertDescription>{el.longMessage}</AlertDescription>
                                    </Alert>
                                ))
                            )}
                            <Button type="submit" className="w-full">
                                Sign Up
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={onPressVerify} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Verification Code</Label>
                                <Input
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Enter verification code"
                                    required
                                />
                            </div>
                            {errors && (
                                errors.map((el, index) => (
                                    <Alert variant="destructive">
                                        <AlertDescription>{el?.longMessage || el.message}</AlertDescription>
                                    </Alert>
                                ))
                            )}
                            <Button type="submit" className="w-full">
                                Verify Email
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            href="/sign-in"
                            className="font-medium text-primary hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default SignUpPage
