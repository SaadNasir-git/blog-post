import { NextRequest, NextResponse } from 'next/server';
import { closeDatabaseConnection, executeTypedQuery } from '@/lib/mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const searchQuery = searchParams.get('search') || '';
    const tags = searchParams.get('tags') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause for search and tags
    let whereClause = '';
    const queryParams = [];
    
    if (searchQuery) {
      whereClause += ` AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)`;
      const searchPattern = `%${searchQuery}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (tags) {
      const tagList = tags.split(',');
      whereClause += ` AND (`;
      tagList.forEach((tag, index) => {
        if (index > 0) whereClause += ` AND `;
        whereClause += `JSON_CONTAINS(tags, ?)`;
        queryParams.push(JSON.stringify(tag));
      });
      whereClause += `)`;
    }
    
    // Remove the initial "AND" if no filters are applied
    if (whereClause) {
      whereClause = 'WHERE ' + whereClause.substring(4);
    }

    // Determine sort order and column - FIXED: Use 'date' column instead of 'created_at'
    const orderBy = sortBy === 'oldest' ? 'ASC' : 'DESC';
    
    // Get paginated results - FIXED: Order by 'date' column
    const rows = await executeTypedQuery(
      `SELECT * FROM blogpost ${whereClause} ORDER BY date ${orderBy} LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // Get total count for pagination
    const countResult = await executeTypedQuery(
      `SELECT COUNT(*) as total FROM blogpost ${whereClause}`,
      queryParams
    );
    
    const total = (countResult)[0].total;

    closeDatabaseConnection()
    
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