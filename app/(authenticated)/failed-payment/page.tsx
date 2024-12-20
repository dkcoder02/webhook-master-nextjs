'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, RefreshCcw } from 'lucide-react'
import Link from "next/link"

export default function FailedPayment() {
    const handleTryAgain = () => {
        // Implement the logic to retry the payment
        console.log("Retrying payment...")
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <CardTitle className="text-center text-2xl font-bold text-red-600">Payment Failed</CardTitle>
                    <CardDescription className="text-center">
                        We're sorry, but your payment could not be processed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        This could be due to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
                        <li>Insufficient funds</li>
                        <li>Incorrect card information</li>
                        <li>Temporary issue with your payment method</li>
                        <li>Your card issuer declined the transaction</li>
                    </ul>
                    <p className="text-sm text-gray-600">
                        Please check your payment details and try again. If the problem persists, contact your bank or our support team.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button onClick={handleTryAgain} className="w-full">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                    <Button variant="outline" className="w-full">
                        Contact Support
                    </Button>
                    <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 mt-4 inline-flex items-center">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Return to Homepage
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}

