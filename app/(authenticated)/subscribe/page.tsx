"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";

export default function SubscribePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriptionEnds, setSubscriptionEnds] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancel, setIsCancel] = useState(true);

    const fetchSubscriptionStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/subscription");
            if (response.ok) {
                const data = await response.json();
                setIsSubscribed(data.isSubscribed);
                setSubscriptionEnds(data.subscriptionEnds);
            } else {
                throw new Error("Failed to fetch subscription status");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch subscription status. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    const handleSubscribe = async () => {
        try {
            const response = await fetch("/api/subscription", { method: "POST" });
            if (response.ok) {
                const data = await response.json();
                if (data?.redirectURL) {
                    router.replace(data?.redirectURL);
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to subscribe");
            }
        } catch (error) {
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "An error occurred while subscribing. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleSubscriptionCancel = async (isCancel: boolean) => {
        try {
            setIsCancel(isCancel);
            const response = await fetch("/api/subscription/stripe", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isSubscriptionCancelled: isCancel })
            });
            if (response.ok) {
                const data = await response.json();
                console.log("data", data);
                toast({
                    title: "Success",
                    description: data.message,
                });

            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to cancel subscription");
            }
        } catch (error) {
            console.log("error", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "An error occurred while cancel subscription. Please try again.",
                variant: "destructive",
            });
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <BackButton />
            <h1 className="text-3xl font-bold mb-8 text-center">Subscription</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Your Subscription Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {isSubscribed ? (
                        <>
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    You are a subscribed user. Subscription ends on{" "}
                                    {new Date(subscriptionEnds!).toLocaleDateString()}
                                </AlertDescription>
                            </Alert>
                            <Button disabled={isCancel} onClick={() => handleSubscriptionCancel(true)} className="mt-4">
                                Cancel
                            </Button>

                            <Button disabled={!isCancel} onClick={() => handleSubscriptionCancel(false)} className="mt-4">
                                Resume
                            </Button>
                        </>
                    ) : (
                        <>
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    You are not currently subscribed. Subscribe now to unlock all
                                    features!
                                </AlertDescription>
                            </Alert>
                            <Button onClick={handleSubscribe} className="mt-4">
                                Subscribe Now
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}