import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Statistic, message, Segmented, DatePicker, Space, Table, InputNumber, Tag } from 'antd';
import { Column, Pie, Line } from '@ant-design/plots';
import api from '../../api/axios';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState('day');
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [range, setRange] = useState(null); // [moment,moment]
  const [topMetric, setTopMetric] = useState('quantity');
  const [topProducts, setTopProducts] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [stockThreshold, setStockThreshold] = useState(5);
  const [overview, setOverview] = useState({
    revenue_total: 0,
    orders_completed_count: 0,
    orders_by_status: [],
    revenue_by_day: [],
    products_count: 0,
    users_count: 0,
    categories_count: 0,
    orders_count: 0,
    aov: 0,
    recent_orders: [],
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/overview');
        setOverview(res.data);
      } catch (err) {
        message.error(err.response?.data?.message || 'Lỗi khi tải dữ liệu tổng quan');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  useEffect(() => {
    const fetchRevenueSeries = async () => {
      try {
        const params = { granularity };
        if (range && range[0] && range[1]) {
          params.from = range[0].format('YYYY-MM-DD');
          params.to = range[1].format('YYYY-MM-DD');
        }
        const res = await api.get('/analytics/revenue', { params });
        const series = res.data?.series || [];
        
        // Fix labels for week/month/year to be more readable
        const formattedSeries = series.map(d => {
          let label = d.label;
          if (granularity === 'day') {
            // Xử lý chuỗi YYYY-MM-DD hoặc Date string một cách an toàn
            let date;
            if (typeof label === 'string' && label.includes('-')) {
              const [y, m, dayPart] = label.split('-').map(Number);
              date = new Date(y, m - 1, dayPart);
            } else {
              date = new Date(label);
            }
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            label = `${day}/${month}`;
          } else if (granularity === 'week') {
            const year = label.substring(0, 4);
            const week = label.substring(4);
            label = `Tuần ${week}/${year}`;
          } else if (granularity === 'month') {
            const [y, m] = label.split('-');
            label = `Tháng ${m}/${y}`;
          } else if (granularity === 'year') {
            label = `Năm ${label}`;
          }
          return { ...d, label };
        });
        
        setRevenueSeries(formattedSeries);
      } catch (err) {
        message.error(err.response?.data?.message || 'Lỗi khi tải doanh thu theo chu kỳ');
      }
    };
    fetchRevenueSeries();
  }, [granularity, range]);

  const currency = (v) => Number(v).toLocaleString('vi-VN') + ' đ';

  const axisLabelStyle = {
    fill: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
    fontWeight: 800,
  };

  const axisLineStyle = { stroke: 'rgba(255, 255, 255, 0.28)' };
  const axisTickStyle = { stroke: 'rgba(255, 255, 255, 0.28)' };

  const columnConfig = {
    data: revenueSeries.map(d => ({
      label: d.label,
      revenue: d.revenue,
    })),
    xField: 'label',
    yField: 'revenue',
    theme: 'dark',
    label: {
      position: 'top',
      content: (datum) => (datum?.revenue ? Number(datum.revenue).toLocaleString('vi-VN') : ''),
      style: {
        fill: 'rgba(255, 255, 255, 0.92)',
        fontWeight: 900,
        fontSize: 12,
        shadowColor: 'rgba(0, 0, 0, 0.65)',
        shadowBlur: 8,
      },
    },
    tooltip: {
      formatter: (datum) => ({ name: 'Doanh thu', value: currency(datum.revenue) }),
    },
    columnStyle: { radiusTopLeft: 4, radiusTopRight: 4 },
    xAxis: {
      label: { style: axisLabelStyle },
      line: { style: axisLineStyle },
      tickLine: { style: axisTickStyle },
    },
    yAxis: {
      label: {
        style: axisLabelStyle,
        formatter: (v) => Number(v).toLocaleString('vi-VN'),
      },
      grid: { line: { style: { stroke: 'rgba(255, 255, 255, 0.09)', lineDash: [4, 4] } } },
      line: { style: axisLineStyle },
      tickLine: { style: axisTickStyle },
    },
  };

  const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const statusColors = {
    'Chờ xác nhận': '#faad14', // Warning gold
    'Đã xác nhận': '#13c2c2',
    'Đang giao': '#1890ff',    // Processing blue
    'Hoàn thành': '#52c41a',   // Success green
    'Đã hủy': '#ff4d4f',       // Error red
  };

  const pieConfig = {
    data: overview.orders_by_status.map(s => ({
      type: statusLabels[s.status] || s.status,
      value: s.count,
    })),
    angleField: 'value',
    colorField: 'type',
    theme: 'dark',
    color: ({ type }) => statusColors[type] || '#d9d9d9',
    label: {
      text: 'value',
      style: {
        fill: 'rgba(255, 255, 255, 0.95)',
        fontWeight: 800,
        fontSize: 14,
        shadowColor: 'rgba(0, 0, 0, 0.55)',
        shadowBlur: 6,
      },
    },
    legend: {
      position: 'top',
      itemName: {
        style: {
          fill: 'rgba(241, 245, 249, 0.9)',
          fontWeight: 700,
          fontSize: 12,
        },
      },
    },
  };

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const res = await api.get('/analytics/top-products', { params: { metric: topMetric, limit: 10 } });
        setTopProducts(res.data?.items || []);
      } catch (_e) {
        void _e;
        message.error('Lỗi khi tải Top sản phẩm');
      }
    };
    fetchTop();
  }, [topMetric]);

  useEffect(() => {
    const fetchCat = async () => {
      try {
        const res = await api.get('/analytics/revenue-by-category');
        setRevenueByCategory(res.data || []);
      } catch (_e) {
        void _e;
        message.error('Lỗi khi tải Doanh thu theo danh mục');
      }
    };
    fetchCat();
  }, []);

  useEffect(() => {
    const fetchLow = async () => {
      try {
        const res = await api.get('/analytics/low-stock', { params: { threshold: stockThreshold } });
        setLowStock(res.data || []);
      } catch (_e) {
        void _e;
        message.error('Lỗi khi tải Tồn kho thấp');
      }
    };
    fetchLow();
  }, [stockThreshold]);

  const catColumnConfig = {
    data: revenueByCategory.map(r => ({ category: r.category_name, revenue: r.revenue })),
    xField: 'category',
    yField: 'revenue',
    theme: 'dark',
    label: {
      position: 'top',
      content: (datum) => (datum?.revenue ? Number(datum.revenue).toLocaleString('vi-VN') : ''),
      style: {
        fill: 'rgba(255, 255, 255, 0.92)',
        fontWeight: 900,
        fontSize: 12,
        shadowColor: 'rgba(0, 0, 0, 0.65)',
        shadowBlur: 8,
      },
    },
    tooltip: { formatter: (d) => ({ name: 'Doanh thu', value: currency(d.revenue) }) },
    columnStyle: { radiusTopLeft: 4, radiusTopRight: 4 },
    xAxis: {
      label: { style: axisLabelStyle },
      line: { style: axisLineStyle },
      tickLine: { style: axisTickStyle },
    },
    yAxis: {
      label: {
        style: axisLabelStyle,
        formatter: (v) => Number(v).toLocaleString('vi-VN'),
      },
      grid: { line: { style: { stroke: 'rgba(255, 255, 255, 0.09)', lineDash: [4, 4] } } },
      line: { style: axisLineStyle },
      tickLine: { style: axisTickStyle },
    },
  };

  const lowStockColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Danh mục', dataIndex: 'category_name', key: 'category_name', width: 160 },
    { title: 'Tồn kho', dataIndex: 'stock', key: 'stock', width: 100 },
  ];

  const topProductsConfig = {
    data: topProducts
      .map(p => ({
        name: p.name,
        value: topMetric === 'quantity' ? Number(p.total_qty) : Number(p.total_revenue),
      }))
      .sort((a, b) => b.value - a.value), // Sắp xếp giảm dần để giá trị cao nhất nằm bên trái
    xField: 'name',
    yField: 'value',
    theme: 'dark',
    point: {
      shapeField: 'circle',
      size: 4,
    },
    label: {
      position: 'top',
      content: (datum) => (topMetric === 'revenue' ? currency(datum.value) : datum.value),
      style: {
        fill: 'rgba(255, 255, 255, 0.92)',
        fontWeight: 900,
        fontSize: 12,
        shadowColor: 'rgba(0, 0, 0, 0.65)',
        shadowBlur: 8,
      },
    },
    tooltip: {
      formatter: (datum) => ({ 
        name: topMetric === 'quantity' ? 'Số lượng' : 'Doanh thu', 
        value: topMetric === 'revenue' ? currency(datum.value) : datum.value 
      }),
    },
    xAxis: {
      label: {
        style: axisLabelStyle,
      },
      line: { style: axisLineStyle },
      tickLine: { style: axisTickStyle },
    },
    yAxis: {
      label: { 
        style: axisLabelStyle, 
        formatter: (v) => topMetric === 'revenue' ? Number(v).toLocaleString('vi-VN') : v,
      },
      grid: { line: { style: { stroke: 'rgba(255, 255, 255, 0.09)', lineDash: [4, 4] } } },
      line: { style: axisLineStyle },
      tickLine: { style: axisTickStyle },
    },
  };

  const recentOrderColumns = [
    { title: 'Mã đơn', dataIndex: 'id', key: 'id', width: 100, render: v => <b>#{v}</b> },
    { title: 'Khách hàng', dataIndex: 'customer_name', key: 'customer_name', render: v => v || 'Khách vãng lai' },
    { title: 'Tổng tiền', dataIndex: 'total_price', key: 'total_price', render: v => currency(v) },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status', 
      render: s => {
        const label = statusLabels[s] || s;
        const color = s === 'completed' ? 'success' : s === 'cancelled' ? 'error' : s === 'shipping' ? 'processing' : 'warning';
        return <Tag color={color}>{label}</Tag>;
      }
    },
    { title: 'Ngày đặt', dataIndex: 'created_at', key: 'created_at', render: v => new Date(v).toLocaleString('vi-VN') },
  ];

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }} className="!text-slate-100">Dashboard</Title>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} loading={loading}>
            <Statistic
              title="Tổng Doanh thu"
              value={overview.revenue_total}
              formatter={(v) => currency(v)}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} loading={loading}>
            <Statistic
              title="Giá trị đơn TB (AOV)"
              value={overview.aov}
              formatter={(v) => currency(v)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} loading={loading}>
            <Statistic
              title="Đơn hoàn thành"
              value={overview.orders_completed_count}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} loading={loading}>
            <Statistic 
              title="Đơn đã hủy" 
              value={overview.orders_by_status.find(s => s.status === 'cancelled')?.count || 0} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} loading={loading}>
            <Statistic title="Tổng Sản phẩm" value={overview.products_count} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} loading={loading}>
            <Statistic title="Tổng Người dùng" value={overview.users_count} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} loading={loading}>
            <Statistic title="Tổng Danh mục" value={overview.categories_count} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} loading={loading}>
            <Statistic title="Tổng Đơn hàng" value={overview.orders_count} />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card bordered={false} title="Doanh thu theo chu kỳ (đ)" loading={loading}
                extra={
                  <Space wrap>
                    <Segmented
                      options={[
                        { label: 'Ngày', value: 'day' },
                        { label: 'Tuần', value: 'week' },
                        { label: 'Tháng', value: 'month' },
                        { label: 'Năm', value: 'year' },
                      ]}
                      value={granularity}
                      onChange={setGranularity}
                    />
                    <DatePicker.RangePicker
                      allowClear
                      value={range}
                      onChange={(v) => setRange(v)}
                      placeholder={['Từ ngày', 'Đến ngày']}
                    />
                  </Space>
                }>
            <Column {...columnConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} title="Tỷ lệ trạng thái đơn hàng" loading={loading}>
            <Pie {...pieConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card bordered={false} title="Top sản phẩm bán chạy" extra={
            <Segmented
              options={[
                { label: 'Theo số lượng', value: 'quantity' },
                { label: 'Theo doanh thu', value: 'revenue' },
              ]}
              value={topMetric}
              onChange={setTopMetric}
            />
          }>
            <div style={{ height: 450 }}>
              <Line {...topProductsConfig} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} title="Doanh thu theo danh mục">
            <Column {...catColumnConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card bordered={false} title="Đơn hàng gần đây" loading={loading}>
            <Table
              size="small"
              columns={recentOrderColumns}
              dataSource={overview.recent_orders}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} title="Sản phẩm tồn kho thấp" extra={
            <Space>
              Ngưỡng:
              <InputNumber min={0} value={stockThreshold} onChange={(v) => setStockThreshold(typeof v === 'number' ? v : 0)} />
            </Space>
          }>
            <Table
              size="small"
              columns={lowStockColumns}
              dataSource={lowStock}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
