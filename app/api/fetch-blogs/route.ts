import { NextRequest, NextResponse } from 'next/server';
import { sqlconnection } from '@/lib/mysql2';
import { ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    let searchQuery = searchParams.get('search') || '';
    const tags = searchParams.get('tags') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const orderBy = sortBy === 'oldest' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;
    const values = [];
    let whereClause = '';

    if (searchQuery) {
      searchQuery = `%${searchQuery}%`;
      whereClause += ' WHERE (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)';
      values.push(searchQuery, searchQuery, searchQuery);
    }

    if (tags) {
      const tagList = tags.split(',').map(tag => JSON.stringify(tag));
      if (!searchQuery) whereClause += ' WHERE ';
      else whereClause += ' AND ';

      const conditions = tagList.map(() => 'JSON_CONTAINS(tags, ?)').join(' AND ');
      whereClause += `(${conditions})`;
      values.push(...tagList);
    }

    // copy values before limit/offset
    const baseValues = [...values];

    // add pagination
    values.push(limit, offset);

    // main query
    const [rows] = await sqlconnection.query(
      `SELECT * FROM blogpost ${whereClause} ORDER BY date ${orderBy} LIMIT ? OFFSET ?`,
      values
    );

    // count query
    const [countResult] = await sqlconnection.query<{ total: number }[] & ResultSetHeader[]>(
      `SELECT COUNT(*) as total FROM blogpost ${whereClause}`,
      baseValues
    );

    const total = countResult[0].total;

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
