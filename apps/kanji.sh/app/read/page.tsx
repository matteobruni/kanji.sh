import React from 'react';
import { PrintingAnimation } from '../../src/components/atoms/AnimatedImage';
import { SubscriptionForm } from '../../src/components/molecules/SubscriptionForm';

export default function ReadPage() {
    return (
        <div className="container flex flex-col items-stretch gap-4 justify-center">
            <div className="text-center">
                <h4>Work In Progress!</h4>
            </div>
            <div className="max-w-[320px] mx-auto">
                <PrintingAnimation className="opacity-95" />
            </div>
            <div className="text-center">
                <div>We haven&apos;t started adding reading worksheets yet.</div>
                <div>If you would like it, signup for the updates. No spams, I promise!</div>
            </div>
            <div className="mt-8">
                <SubscriptionForm />
            </div>
        </div>
    );
}