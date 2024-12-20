import { Button } from "@/components/ui/button"
import { CheckCircle } from 'lucide-react'
import Link from "next/link"

function SuccessPage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
            <div className="text-center">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h1 className="mb-2 text-3xl font-bold">Payment Successful!</h1>
                <p className="mb-8 text-lg text-gray-600">
                    Thank you for your purchase our services
                </p>
                <div className="space-x-4">
                    <Button asChild>
                        <Link href="/">Home</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/subscribe">View Subscription</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default SuccessPage
