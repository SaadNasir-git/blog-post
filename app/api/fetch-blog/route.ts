'use server'
// <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-700 hover:underline" href="https://www.mongodb.com/products/tools/compass">mongodb Atlas</a>
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