import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Empty, Input, Pagination, Row, Select, Skeleton, Space, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ActivityFilters } from '../api/activity';
import ActivityCard from '../components/ActivityCard';
import { useAppSelector } from '../store/hooks';
import { DEFAULT_ACTIVITY_FILTERS, parseActivityFilters, serializeActivityFilters } from '../utils/activityFilters';
import { useActivityCatalog } from '../hooks/useActivityCatalog';
import { useFavorites } from '../hooks/useFavorites';
import './ActivityList.css';

const categories = ['篮球', '足球', '羽毛球', '乒乓球', '网球', '游泳', '健身', '跑步', '其他']
  .map(value => ({ value, label: value }));
const sortOptions = [
  { value: 'createdAt-desc', label: '最新发布' },
  { value: 'startTime-asc', label: '即将开始' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'price-desc', label: '价格从高到低' }
];

const ActivityList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const [filters, setFilters] = useState<ActivityFilters>(() => parseActivityFilters(location.search));
  const { activities, loading, error, userOrders, pagination, setPagination, joining,
    joinActivity, leaveActivity } = useActivityCatalog(filters, isAuthenticated);
  const { favoriteIds, loading: favoritesLoading, ready: favoritesReady, error: favoritesError,
    errorKind: favoritesErrorKind, mutatingId, toggleFavorite, reload: reloadFavorites } = useFavorites(isAuthenticated);

  useEffect(() => {
    const parsed = parseActivityFilters(location.search);
    setFilters(parsed);
    setPagination(previous => ({ ...previous, current: parsed.page || 1 }));
  }, [location.search, setPagination]);

  const applyFilters = (changes: Partial<ActivityFilters>) => {
    const updated = { ...filters, ...changes, page: changes.page ?? 1 };
    setFilters(updated);
    navigate({ search: serializeActivityFilters(updated) }, { replace: true });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_ACTIVITY_FILTERS);
    navigate({ search: serializeActivityFilters(DEFAULT_ACTIVITY_FILTERS) }, { replace: true });
  };

  const handleToggleFavorite = (activityId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    void toggleFavorite(activityId);
  };

  const retryFavorites = () => {
    void reloadFavorites();
  };

  return (
    <div className="activity-list-page">
      <header className="catalog-header">
        <div><Typography.Text type="secondary">发现活动</Typography.Text><Typography.Title level={1}>一起动起来</Typography.Title></div>
        {!loading && !error && <Typography.Text type="secondary">共找到 {pagination.total} 个活动</Typography.Text>}
      </header>

      <Card className="filters-card">
        <Input.Search aria-label="搜索活动" placeholder="搜索活动标题、描述、分类或地点"
          value={filters.search} size="large" allowClear enterButton={<SearchOutlined />}
          onChange={event => setFilters(previous => ({ ...previous, search: event.target.value }))}
          onSearch={value => applyFilters({ search: value })} />
        <div className="filter-grid">
          <Select aria-label="运动分类" placeholder="全部分类" value={filters.category || undefined}
            options={categories} allowClear onChange={value => applyFilters({ category: value || '' })} />
          <Input aria-label="活动地点" placeholder="活动地点" value={filters.location} allowClear
            onChange={event => setFilters(previous => ({ ...previous, location: event.target.value }))}
            onPressEnter={() => applyFilters({ location: filters.location })} />
          <Select aria-label="排序方式" value={`${filters.sortBy}-${filters.sortOrder}`} options={sortOptions}
            onChange={value => { const [sortBy, sortOrder] = value.split('-'); applyFilters({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' }); }} />
          <Space className="filter-actions">
            <Button type="primary" onClick={() => applyFilters({ search: filters.search, location: filters.location })}>应用筛选</Button>
            <Button icon={<ReloadOutlined />} onClick={resetFilters}>重置</Button>
          </Space>
        </div>
      </Card>

      {error && <Alert showIcon type="error" message="活动加载失败" description={error} action={<Button onClick={() => applyFilters({})}>重试</Button>} />}
      {favoritesError && <Alert showIcon type="error"
        message={favoritesErrorKind === 'mutation' ? '收藏操作失败' : '收藏加载失败'} description={favoritesError}
        action={<Button onClick={retryFavorites}>重试</Button>} />}

      <section className="activities-section" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <Row gutter={[20, 20]}>{Array.from({ length: 6 }, (_, index) => <Col xs={24} md={12} lg={8} key={index}><div className="catalog-skeleton"><Skeleton active /></div></Col>)}</Row>
        ) : activities.length > 0 ? (
          <Row gutter={[20, 20]}>{activities.map(activity => <Col xs={24} md={12} lg={8} key={activity._id}>
            <ActivityCard activity={activity} onJoin={joinActivity} onLeave={leaveActivity}
              isJoined={userOrders.includes(activity._id)} loading={joining === activity._id}
              isFavorite={favoriteIds.has(activity._id)} onToggleFavorite={handleToggleFavorite}
              favoriteLoading={isAuthenticated && favoritesLoading || mutatingId === activity._id}
              favoriteDisabled={isAuthenticated && !favoritesReady} />
          </Col>)}</Row>
        ) : !error ? (
          <div className="empty-state"><Empty description="没有找到符合条件的活动"><Button onClick={resetFilters}>清除筛选</Button></Empty></div>
        ) : null}
      </section>

      {!loading && pagination.total > pagination.pageSize && (
        <div className="pagination-section"><Pagination current={pagination.current} total={pagination.total}
          pageSize={pagination.pageSize} onChange={page => applyFilters({ page })} showSizeChanger={false}
          showTotal={total => `共 ${total} 个活动`} /></div>
      )}
    </div>
  );
};

export default ActivityList;
