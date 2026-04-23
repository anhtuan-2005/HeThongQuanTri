import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Space, Popconfirm, message, Typography, Row, Col, Card, Tag, Input, Select, InputNumber, Form } from 'antd';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, DeleteFilled } from '@ant-design/icons';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const ProductList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);

  useEffect(() => {
    fetchProducts({});
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      message.error(err.message || 'Lỗi khi tải danh mục');
    }
  };

  const fetchProducts = async (params) => {
    try {
      setLoading(true);
      const res = await api.get('/products', { params });
      setProducts(res.data);
    } catch (err) {
      message.error(err.message || 'Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const h = setTimeout(() => {
      const params = {};
      if (q && q.trim()) params.q = q.trim();
      if (categoryId) params.category_id = categoryId;
      if (typeof minPrice === 'number') params.minPrice = minPrice;
      if (typeof maxPrice === 'number') params.maxPrice = maxPrice;
      fetchProducts(params);
    }, 400);
    return () => clearTimeout(h);
  }, [q, categoryId, minPrice, maxPrice]);

  const resetFilters = () => {
    setQ('');
    setCategoryId(null);
    setMinPrice(null);
    setMaxPrice(null);
    fetchProducts({});
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      message.success('Sản phẩm đã được chuyển vào thùng rác!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi chuyển vào thùng rác');
    }
  };

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (text, record) => (
        text ? 
        <img src={text} alt={record.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} /> 
        : <div style={{ width: '60px', height: '60px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text type="secondary">N/A</Text></div>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (text) => text ? <Tag color="blue">{text}</Tag> : <Tag color="default">Chưa phân loại</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const v = String(status || 'active');
        return v === 'inactive' ? <Tag color="default">Ngừng bán</Tag> : <Tag color="success">Đang bán</Tag>;
      },
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <Text type="danger" strong>{Number(price).toLocaleString('vi-VN')} đ</Text>,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => (
        <Text strong style={{ color: stock > 0 ? '#52c41a' : '#f5222d' }}>
          {stock || 0}
        </Text>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => (
        <Text type="secondary" style={{ maxWidth: 250 }} ellipsis={{ tooltip: desc }}>
          {desc}
        </Text>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      hidden: !isAdmin,
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/edit/${record.id}`}>
            <Button icon={<EditOutlined />} type="default" style={{ color: '#faad14', borderColor: '#faad14' }}>
              Sửa
            </Button>
          </Link>
          <Popconfirm
            title="Chuyển vào thùng rác?"
            description="Bạn có chắc chắn muốn chuyển sản phẩm này vào thùng rác?"
            onConfirm={() => handleDelete(record.id)}
            okText="Chuyển"
            cancelText="Hủy"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              ghost
            >
              Thùng rác
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  return (
    <div className="p-0">
      <div className="admin-surface flex justify-between items-center mb-6 p-4 rounded-2xl">
        <Title level={3} className="!m-0 !text-slate-100">Danh sách Sản phẩm</Title>
        {isAdmin && (
          <Space size="middle">
            <Link to="/trash">
              <Button icon={<DeleteFilled />} danger ghost size="large" className="rounded-lg">
                Thùng rác
              </Button>
            </Link>
            <Link to="/add">
              <Button type="primary" icon={<PlusCircleOutlined />} size="large" className="rounded-lg shadow-[0_16px_35px_rgba(99,102,241,0.18)]">
                Thêm sản phẩm mới
              </Button>
            </Link>
          </Space>
        )}
      </div>

      <Card bordered={false} className="rounded-2xl overflow-hidden">
        <div style={{ padding: 16, paddingBottom: 0 }}>
          <Form
            form={form}
            layout="inline"
            style={{ rowGap: 12 }}
            onValuesChange={(_, all) => {
              setQ(all.q || '');
              setCategoryId(all.category_id || null);
              setMinPrice(typeof all.minPrice === 'number' ? all.minPrice : null);
              setMaxPrice(typeof all.maxPrice === 'number' ? all.maxPrice : null);
            }}
            initialValues={{
              q,
              category_id: categoryId || undefined,
              minPrice: minPrice ?? undefined,
              maxPrice: maxPrice ?? undefined
            }}
          >
            <Form.Item name="q" style={{ flex: 1, minWidth: 260 }}>
              <Input allowClear placeholder="Tìm theo tên hoặc mô tả..." size="large" />
            </Form.Item>
            <Form.Item name="category_id" style={{ width: 220 }}>
              <Select
                allowClear
                placeholder="Chọn danh mục"
                size="large"
              >
                {categories.map(c => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="minPrice">
              <InputNumber
                placeholder="Giá từ"
                style={{ width: 140 }}
                size="large"
                min={0}
              />
            </Form.Item>
            <Form.Item name="maxPrice">
              <InputNumber
                placeholder="Giá đến"
                style={{ width: 140 }}
                size="large"
                min={0}
              />
            </Form.Item>
            <Form.Item>
              <Button
                onClick={() => {
                  form.resetFields();
                  resetFilters();
                }}
                size="large"
              >
                Xóa lọc
              </Button>
            </Form.Item>
          </Form>
        </div>
        <Table 
          columns={columns} 
          dataSource={products} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default ProductList;
