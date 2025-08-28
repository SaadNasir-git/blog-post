'use server'

import { closeDatabaseConnection, executeTypedQuery } from "@/lib/mysql2";
import { NextResponse } from "next/server";

export async function POST(request:Request) {
    try {
        const body = await request.json();
        const rows = await executeTypedQuery('SELECT * FROM blogpost WHERE slug=?',[body.slug]);
        closeDatabaseConnection()
        return NextResponse.json({
            success: true,
            data: rows[0]
        })
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            success:false,
            data: null
        })
    }
}