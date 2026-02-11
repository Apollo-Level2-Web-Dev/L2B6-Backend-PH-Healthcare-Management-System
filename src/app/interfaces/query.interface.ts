/* eslint-disable @typescript-eslint/no-explicit-any */


export interface PrismaFindManyArgs {
    where ?: Record<string, unknown>;
    include ?: Record<string, unknown>;
    select ?: Record<string, boolean | Record<string, unknown> >
    orderBy ?: Record<string, unknown> | Record<string, unknown>[];
    skip ?: number;
    take ?: number;
    cursor ?: Record<string, unknown>;
    distinct ?: string[] | string;
    [key: string] : unknown;
}

export interface PrismaCountArgs {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, boolean | Record<string, unknown>>
    orderBy?: Record<string, unknown> | Record<string, unknown>[];
    skip?: number;
    take?: number;
    cursor?: Record<string, unknown>;
    distinct?: string[] | string;
    [key: string]: unknown;
}

export interface PrismaModelDelegate {
    findMany(args ?: any) : Promise<any[]>;
    count (args ?: any) : Promise<number>;
}

export interface IQueryParams {
    searchTerm ?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    fields?: string;
    includes?: string;
    [key: string] : string | undefined;
}

export interface IQueryConfig {
    searchableFields?: string[];
    filterableFields?: string[];
}

export interface PrismaStringFilter{
    contains ?: string;
    startsWith ?: string;
    endsWith ?: string;
    mode ?: 'insensitive' | 'default';
    equals ?: string;
    in ?: string[];
    notIn ?: string[];
    lt ?: string;
    lte ?: string;
    gt ?: string;
    gte ?: string;
    not ?: PrismaStringFilter | string;
}

export interface PrismaNumberFilter{
    equals ?: number;
    in ?: number[];
    notIn ?: number[];
    lt ?: number;
    lte ?: number;
    gt ?: number;
    gte ?: number;
    not ?: PrismaNumberFilter | number;
}

export interface PrismaWhereConditions {
    OR ?: Record<string, unknown>[];
    AND ?: Record<string, unknown>[];
    NOT ?: Record<string, unknown>[];
    [key: string] : unknown;
}

export interface IQueryResult<T>{
    data : T[];
    meta : {
        page : number;
        limit : number;
        total : number;
        totalPages : number;
    }
}