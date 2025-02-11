import { ReadingAnimation } from 'apps/kanji.sh/src/components/atoms/AnimatedImage';
import ServiceCard, { Direction } from 'apps/kanji.sh/src/components/molecules/ServiceCard';
import { LocaleParams } from 'apps/kanji.sh/src/types/LocaleParams';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import React from 'react';

export const generateMetadata = async ({ params: { locale } }: LocaleParams) => {
    const t = await getTranslations('home');
    const config = await getTranslations('config');
    return {
        metadataBase: config('baseUrl'),
        alternates: {
            canonical: '/'
        },
        title: t('title'),
        description: t('description'),
        openGraph: {
            locale,
            url: config('baseUrl'),
            siteName: 'Kanji.sh',
            title: t('title'),
            description: t('description'),
            images: [
                {
                    url: '/poster.png',
                    width: 512,
                    height: 300,
                    alt: 'Kanji.sh Poster'
                }
            ]
        }
    };
};

export default async function IndexPage({ params: { locale } }: LocaleParams) {
    unstable_setRequestLocale(locale);
    const t = await getTranslations('home.content');
    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="w-full">
                    <div className="w-full flex flex-col gap-4 justify-center">
                        <div>
                            <h4>{t('welcome-message')}</h4>
                        </div>
                        <div className="text-lg">
                            It already has every kanji worksheet for writing, and soon it will have
                            plenty to practice reading.
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="max-w-[420px] w-[420px] h-[420px]">
                        <ReadingAnimation className="p-4" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-16 py-8">
                <ServiceCard
                    title={'read'}
                    subtitle="What's the point of remembering kanji if you can't read them in a sentence, eh? Soon you will get practice sessions here for the kanjis you know so that you will be able to read 飛躍的に through anything."
                    buttonText={'Join the Waitlist'}
                    buttonLink={'/read'}
                    imageUrl={'/assets/svg/undraw_book_lover.svg'}
                    imageDirection={Direction.start}
                />
                <ServiceCard
                    title={'write'}
                    subtitle={
                        'Although it seems old school, writing is still one of the best ways to improve language skills. Dive in the stroke orders, and make sense of complex kanjis.'
                    }
                    buttonText={'Download Worksheets'}
                    buttonLink={'/write'}
                    imageUrl={'/assets/svg/undraw_studying.svg'}
                    imageDirection={Direction.end}
                />
            </div>
        </div>
    );
}
