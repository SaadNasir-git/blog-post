'use server'

import { sqlconnection } from "@/lib/mysql2";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

export async function POST(request:Request) {
    try {
        const body = await request.json();
        const [rows] = await sqlconnection.query<ResultSetHeader & RowDataPacket[]>('SELECT * FROM blogpost WHERE slug=?',[body.slug]);
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