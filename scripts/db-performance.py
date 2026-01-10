#!/usr/bin/env python3
"""
Database Query Performance Analyzer
Analyze slow queries and suggest optimizations
"""
import time
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict
import json


class QueryAnalyzer:
    """Analyze database query performance"""
    
    def __init__(self, connection_string: str):
        self.conn = psycopg2.connect(connection_string)
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
    
    def enable_query_logging(self):
        """Enable slow query logging"""
        self.cursor.execute("""
            ALTER DATABASE postgres SET log_min_duration_statement = 100;
            ALTER DATABASE postgres SET log_statement = 'all';
        """)
        self.conn.commit()
    
    def get_slow_queries(self, threshold_ms: int = 100) -> List[Dict]:
        """Get queries slower than threshold"""
        self.cursor.execute("""
            SELECT 
                query,
                calls,
                total_time,
                mean_time,
                max_time,
                stddev_time
            FROM pg_stat_statements
            WHERE mean_time > %s
            ORDER BY mean_time DESC
            LIMIT 20
        """, (threshold_ms,))
        
        return self.cursor.fetchall()
    
    def analyze_table_stats(self) -> List[Dict]:
        """Get table statistics"""
        self.cursor.execute("""
            SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                n_live_tup as live_rows,
                n_dead_tup as dead_rows,
                last_vacuum,
                last_autovacuum,
                last_analyze,
                last_autoanalyze
            FROM pg_stat_user_tables
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        """)
        
        return self.cursor.fetchall()
    
    def get_missing_indexes(self) -> List[Dict]:
        """Suggest missing indexes"""
        self.cursor.execute("""
            SELECT 
                schemaname,
                tablename,
                attname,
                n_distinct,
                correlation
            FROM pg_stats
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            AND n_distinct > 100
            AND correlation < 0.5
            ORDER BY n_distinct DESC
            LIMIT 20
        """)
        
        return self.cursor.fetchall()
    
    def analyze_index_usage(self) -> List[Dict]:
        """Check index usage statistics"""
        self.cursor.execute("""
            SELECT
                schemaname,
                tablename,
                indexname,
                idx_scan as scans,
                idx_tup_read as tuples_read,
                idx_tup_fetch as tuples_fetched,
                pg_size_pretty(pg_relation_size(indexrelid)) as size
            FROM pg_stat_user_indexes
            ORDER BY idx_scan ASC
            LIMIT 20
        """)
        
        return self.cursor.fetchall()
    
    def get_cache_hit_ratio(self) -> Dict:
        """Get cache hit ratio"""
        self.cursor.execute("""
            SELECT 
                sum(heap_blks_read) as heap_read,
                sum(heap_blks_hit) as heap_hit,
                sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
            FROM pg_statio_user_tables
        """)
        
        result = self.cursor.fetchone()
        return {
            'heap_read': result['heap_read'],
            'heap_hit': result['heap_hit'],
            'ratio': float(result['ratio']) if result['ratio'] else 0
        }
    
    def explain_query(self, query: str) -> str:
        """Get EXPLAIN ANALYZE for query"""
        self.cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query}")
        return json.dumps(self.cursor.fetchone(), indent=2)
    
    def generate_report(self):
        """Generate performance report"""
        print("=" * 80)
        print("DATABASE PERFORMANCE REPORT")
        print("=" * 80)
        
        # Slow queries
        print("\n📊 SLOW QUERIES (>100ms)")
        print("-" * 80)
        slow_queries = self.get_slow_queries()
        
        for i, query in enumerate(slow_queries[:10], 1):
            print(f"\n{i}. Mean Time: {query['mean_time']:.2f}ms")
            print(f"   Calls: {query['calls']}")
            print(f"   Query: {query['query'][:100]}...")
        
        # Table stats
        print("\n\n📈 TABLE STATISTICS")
        print("-" * 80)
        tables = self.analyze_table_stats()
        
        for table in tables[:10]:
            print(f"\n{table['tablename']} ({table['size']})")
            print(f"  Live Rows: {table['live_rows']:,}")
            print(f"  Dead Rows: {table['dead_rows']:,}")
            if table['dead_rows'] > table['live_rows'] * 0.1:
                print(f"  ⚠️  High dead rows - consider VACUUM")
        
        # Missing indexes
        print("\n\n🔍 POTENTIAL MISSING INDEXES")
        print("-" * 80)
        missing = self.get_missing_indexes()
        
        for idx in missing[:10]:
            print(f"\n{idx['tablename']}.{idx['attname']}")
            print(f"  Distinct Values: {idx['n_distinct']}")
            print(f"  Correlation: {idx['correlation']:.3f}")
            print(f"  💡 Suggestion: CREATE INDEX idx_{idx['tablename']}_{idx['attname']} ON {idx['tablename']}({idx['attname']})")
        
        # Index usage
        print("\n\n📑 UNUSED INDEXES")
        print("-" * 80)
        indexes = self.analyze_index_usage()
        
        for idx in indexes[:10]:
            if idx['scans'] == 0:
                print(f"\n❌ {idx['indexname']} (never used, size: {idx['size']})")
                print(f"   💡 Consider: DROP INDEX {idx['indexname']}")
        
        # Cache hit ratio
        print("\n\n💾 CACHE HIT RATIO")
        print("-" * 80)
        cache = self.get_cache_hit_ratio()
        ratio_percent = cache['ratio'] * 100
        
        print(f"Cache Hit Ratio: {ratio_percent:.2f}%")
        if ratio_percent < 90:
            print("⚠️  Low cache hit ratio - consider increasing shared_buffers")
        else:
            print("✅ Good cache hit ratio")
        
        print("\n" + "=" * 80)
    
    def close(self):
        """Close connection"""
        self.cursor.close()
        self.conn.close()


if __name__ == "__main__":
    import os
    
    # Database connection
    DB_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/cms"
    )
    
    analyzer = QueryAnalyzer(DB_URL)
    
    try:
        analyzer.generate_report()
    finally:
        analyzer.close()
