import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ address: string }> } // تحويلها إلى Promise
) {
    const { address } = await params; // إضافة await هنا لسحب العنوان

    try {
        // ... باقي الكود كما هو ...
        const mockScore = Math.floor(Math.random() * (90 - 40) + 40);
        
        let level = "Bronze";
        if (mockScore > 70) level = "Gold";
        else if (mockScore > 50) level = "Silver";

        return NextResponse.json({
            score: mockScore,
            level: level,
            address: address,
            timestamp: Date.now()
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to calculate score" }, { status: 500 });
    }
}