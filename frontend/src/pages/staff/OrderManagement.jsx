import { useState, useEffect, useRef } from 'react';
import { Table, Tag, Typography, Card, message, Select, Button, Modal, List, Divider, Row, Col, Form, InputNumber, Input, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option, OptGroup } = Select;
const { RangePicker } = DatePicker;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterForm] = Form.useForm();
  const debounceTimer = useRef(null);

  // States for Order Detail Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // States for Create Order Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [totalPricePreview, setTotalPricePreview] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (values = {}) => {
    try {
      setLoading(true);
      const params = { ...values };
      
      if (values.dateRange && values.dateRange.length === 2) {
        params.fromDate = values.dateRange[0].format('YYYY-MM-DD');
        params.toDate = values.dateRange[1].format('YYYY-MM-DD');
        delete params.dateRange;
      }

      const res = await api.get('/orders', { params });
      setOrders(res.data);
    } catch (err) {
      message.error(err.message || 'Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const onFilterChange = () => {
    const values = filterForm.getFieldsValue();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchOrders(values);
    }, 500);
  };

  const resetFilters = () => {
    filterForm.resetFields();
    fetchOrders();
  };

  const fetchUsersAndProducts = async () => {
    try {
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
    } catch {
      message.error('Lỗi khi tải dữ liệu sản phẩm');
    }

    try {
      const usersRes = await api.get('/users');
      setUsers(usersRes.data);
    } catch {
      console.warn('Không lấy được danh sách người dùng (có thể do phân quyền).');
      setUsers([]);
    }

    try {
      const customersRes = await api.get('/customers');
      const activeCustomers = Array.isArray(customersRes.data)
        ? customersRes.data.filter(c => !c.isDeleted)
        : [];
      setCustomers(activeCustomers);
    } catch {
      console.warn('Không lấy được danh sách khách hàng.');
      setCustomers([]);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    fetchUsersAndProducts();
    createForm.resetFields();
    createForm.setFieldsValue({ items: [{}] });
    setTotalPricePreview(0);
  };

  const calculateTotalPrice = (items) => {
    if (!items || !products.length) return 0;
    return items.reduce((sum, item) => {
      if (!item || !item.product_id || !item.quantity) return sum;
      const product = products.find(p => p.id === item.product_id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const handleCreateOrder = async (values) => {
    try {
      setCreateLoading(true);
      const ref = String(values.customer_ref || '');
      const payloadCustomer = { user_id: null, customer_id: null };
      if (ref.startsWith('user:')) {
        payloadCustomer.user_id = Number(ref.replace('user:', '')) || null;
      } else if (ref.startsWith('customer:')) {
        payloadCustomer.customer_id = Number(ref.replace('customer:', '')) || null;
      }
      
      const totalPrice = calculateTotalPrice(values.items);
      const orderItems = values.items
        .filter(item => item && item.product_id && item.quantity)
        .map(item => {
          const product = products.find(p => p.id === item.product_id);
          if (product && item.quantity > product.stock) {
            throw new Error(`Sản phẩm "${product.name}" không đủ tồn kho (Còn: ${product.stock})`);
          }
          return {
            product_id: item.product_id,
            quantity: item.quantity
          };
        });

      if (orderItems.length === 0) {
        message.warning('Vui lòng chọn ít nhất một sản phẩm');
        return;
      }

      const payload = {
        user_id: payloadCustomer.user_id,
        customer_id: payloadCustomer.customer_id,
        items: orderItems,
        total_price: totalPrice
      };

      await api.post('/orders', payload);
      message.success('Tạo đơn hàng thành công');
      setIsCreateModalOpen(false);
      fetchOrders();
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      message.success('Cập nhật trạng thái thành công');
      fetchOrders(); // Refresh table
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const normalizePaymentStatus = (value) => {
    const s = String(value || '').trim().toLowerCase();
    const map = {
      'đã thanh toán': 'paid',
      'da thanh toan': 'paid',
      paid: 'paid',
      'chưa thanh toán': 'unpaid',
      'chua thanh toan': 'unpaid',
      unpaid: 'unpaid'
    };
    return map[s] || s;
  };

  const toValidPaymentStatus = (value) => {
    const s = normalizePaymentStatus(value);
    if (s === 'paid' || s === 'unpaid') return s;
    return 'unpaid';
  };

  const handlePaymentStatusToggle = async (record) => {
    const current = toValidPaymentStatus(record.payment_status);
    const next = current === 'paid' ? 'unpaid' : 'paid';

    try {
      try {
        await api.put(`/orders/${record.id}/payment-status`, { payment_status: next });
      } catch {
        await api.put(`/orders/${record.id}`, { payment_status: next });
      }
      message.success('Cập nhật thanh toán thành công');
      fetchOrders();
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể cập nhật trạng thái thanh toán');
    }
  };

  const showOrderDetails = async (orderId) => {
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (_e) {
      void _e;
      message.error('Không tải được chi tiết đơn hàng!');
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const normalizeStatus = (value) => {
    const s = String(value || '').trim().toLowerCase();
    const map = {
      'chờ xác nhận': 'pending',
      'cho xac nhan': 'pending',
      'đã xác nhận': 'confirmed',
      'da xac nhan': 'confirmed',
      'đang giao': 'shipping',
      'dang giao': 'shipping',
      'hoàn thành': 'completed',
      'hoan thanh': 'completed',
      'đã hủy': 'cancelled',
      'da huy': 'cancelled',
      'đã huỷ': 'cancelled',
      'da huỷ': 'cancelled',
      'hủy': 'cancelled',
      'huỷ': 'cancelled',
      'canceled': 'cancelled'
    };
    return map[s] || s;
  };

  const toValidStatus = (value) => {
    const s = normalizeStatus(value);
    if (s === 'pending' || s === 'confirmed' || s === 'shipping' || s === 'completed' || s === 'cancelled') {
      return s;
    }
    return 'pending';
  };

  const getAllowedNextStatuses = (currentStatus) => {
    const s = toValidStatus(currentStatus);
    const transitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipping', 'cancelled'],
      shipping: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };
    return transitions[s] || [];
  };

  const columns = [
    {
      title: 'Mã Đơn',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: text => <Text strong>#{text}</Text>,
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: text => text ? <Text strong>{text}</Text> : <Text type="secondary" italic>Khách vãng lai</Text>,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_price',
      key: 'total_price',
      render: price => <Text type="danger" strong>{Number(price).toLocaleString('vi-VN')} đ</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => {
        const currentStatus = toValidStatus(record.status);
        const allowedNext = getAllowedNextStatuses(currentStatus);
        const isFinal = currentStatus === 'completed' || currentStatus === 'cancelled';
        const isOptionDisabled = (value) => value !== currentStatus && !allowedNext.includes(value);
        return (
          <Select
            value={currentStatus}
            style={{ width: 160 }}
            onChange={(val) => handleStatusChange(record.id, val)}
            disabled={isFinal}
          >
            <Option value="pending" disabled={isOptionDisabled('pending')}>Chờ xác nhận</Option>
            <Option value="confirmed" disabled={isOptionDisabled('confirmed')}>Đã xác nhận</Option>
            <Option value="shipping" disabled={isOptionDisabled('shipping')}>Đang giao</Option>
            <Option value="completed" disabled={isOptionDisabled('completed')}>Hoàn thành</Option>
            <Option value="cancelled" disabled={isOptionDisabled('cancelled')}>Đã hủy</Option>
          </Select>
        );
      },
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 140,
      render: (_, record) => {
        const v = toValidPaymentStatus(record.payment_status);
        return (
          <Button
            type={v === 'paid' ? 'primary' : 'default'}
            onClick={() => handlePaymentStatusToggle(record)}
          >
            {v === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </Button>
        );
      }
    },
    {
      title: 'Ngày đặt hàng',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (_, record) => new Date(record.createdDate || record.created_at).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Button type="primary" onClick={() => showOrderDetails(record.id)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="px-2">
      <div className="admin-surface mb-6 mt-2 flex justify-between items-center p-4 rounded-2xl">
        <Title level={3} className="!mb-0 !text-slate-100 font-bold tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-indigo-200 border border-slate-700/40">
            <FilterOutlined className="text-lg" />
          </span>
          Quản lý Đơn Hàng
        </Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleOpenCreateModal}
          size="large"
          className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 h-11"
        >
          Tạo đơn hàng
        </Button>
      </div>

      <Card bordered={false} className="mb-6 rounded-2xl">
        <Form
          form={filterForm}
          layout="inline"
          onValuesChange={onFilterChange}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
        >
          <Form.Item name="search">
            <Input
              placeholder="Tìm tên khách hàng..."
              prefix={<SearchOutlined style={{ color: 'rgba(148,163,184,0.9)' }} />}
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>

          <Form.Item name="status">
            <Select
              placeholder="Trạng thái"
              style={{ width: 150 }}
              allowClear
              suffixIcon={<FilterOutlined />}
            >
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="shipping">Đang giao</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Form.Item>

          <Form.Item name="dateRange">
            <RangePicker 
              placeholder={['Từ ngày', 'Đến ngày']}
              style={{ width: 280 }}
            />
          </Form.Item>

          <Form.Item>
            <Button onClick={resetFilters}>Làm mới</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false} className="shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
        <Table 
          columns={columns} 
          dataSource={orders} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal Tạo đơn hàng */}
      <Modal
        title="Tạo Đơn Hàng Mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createLoading}
        width={700}
        okText="Tạo đơn"
        cancelText="Hủy"
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateOrder}
          initialValues={{ items: [{}] }}
          onValuesChange={(_, allValues) => {
            setTotalPricePreview(calculateTotalPrice(allValues.items));
          }}
        >
          <Form.Item
            name="customer_ref"
            label="Chọn Khách hàng"
            rules={[{ required: false }]}
          >
            <Select 
              placeholder="Chọn khách hàng (Để trống nếu là khách vãng lai)" 
              showSearch 
              optionFilterProp="children"
              allowClear
            >
              {users.length > 0 && (
                <OptGroup label="Tài khoản hệ thống (Admin/Nhân viên)">
                  {users.map(user => (
                    <Option key={`user-${user.id}`} value={`user:${user.id}`}>
                      {user.name} ({user.email}) - {user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Nhân viên' : 'Người dùng'}
                    </Option>
                  ))}
                </OptGroup>
              )}
              {customers.length > 0 && (
                <OptGroup label="Khách hàng">
                  {customers.map(customer => (
                    <Option key={`customer-${customer.id}`} value={`customer:${customer.id}`}>
                      {customer.name} ({customer.phone}) - Khách hàng
                    </Option>
                  ))}
                </OptGroup>
              )}
            </Select>
          </Form.Item>

          <Divider orientation="left">Danh sách sản phẩm</Divider>

          <Form.List 
            name="items"
            rules={[
              {
                validator: async (_, items) => {
                  if (!items || items.length < 1) {
                    return Promise.reject(new Error('Vui lòng thêm ít nhất một sản phẩm'));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={14}>
                      <Form.Item
                        {...restField}
                        name={[name, 'product_id']}
                        rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                        noStyle
                      >
                        <Select 
                          placeholder="Chọn sản phẩm" 
                          showSearch 
                          optionFilterProp="children"
                        >
                          {products
                            .filter(p => p.status !== 'inactive')
                            .map(product => (
                              <Option key={product.id} value={product.id} disabled={product.stock <= 0}>
                                {product.name} - {Number(product.price).toLocaleString('vi-VN')} đ (Tồn: {product.stock})
                              </Option>
                            ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[
                          { required: true, message: 'Số lượng' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || value < 1) {
                                return Promise.reject(new Error('SL tối thiểu là 1'));
                              }
                              const productId = getFieldValue(['items', name, 'product_id']);
                              const selectedProduct = products.find(p => p.id === productId);
                              if (selectedProduct && value > selectedProduct.stock) {
                                return Promise.reject(new Error(`Vượt tồn quá (${selectedProduct.stock})`));
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                        noStyle
                      >
                        <InputNumber 
                          min={1} 
                          max={products.find(p => p.id === createForm.getFieldValue(['items', name, 'product_id']))?.stock || 1000}
                          placeholder="Số lượng" 
                          style={{ width: '100%' }} 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      {fields.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => {
                            remove(name);
                            const currentItems = createForm.getFieldValue('items');
                            setTotalPricePreview(calculateTotalPrice(currentItems));
                          }} 
                        />
                      )}
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    block 
                    icon={<PlusOutlined />}
                  >
                    Thêm sản phẩm
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Text strong style={{ fontSize: 16 }}>
              Tổng cộng tạm tính: <Text type="danger">{totalPricePreview.toLocaleString('vi-VN')} đ</Text>
            </Text>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`Chi tiết đơn hàng #${selectedOrder?.id || ''}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        {modalLoading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>Đang tải dữ liệu...</div>
        ) : selectedOrder ? (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Tên Khách hàng:</Text><br/>
                <Text strong>{selectedOrder.customer_name || 'Khách vãng lai'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Email:</Text><br/>
                <Text strong>{selectedOrder.customer_email || 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Ngày đặt:</Text><br/>
                <Text strong>{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Trạng thái hiện tại:</Text><br/>
                <Text strong style={{ textTransform: 'uppercase' }}>{selectedOrder.status}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Thanh toán:</Text><br/>
                {toValidPaymentStatus(selectedOrder.payment_status) === 'paid' ? (
                  <Tag color="success">Đã thanh toán</Tag>
                ) : (
                  <Tag color="warning">Chưa thanh toán</Tag>
                )}
              </Col>
            </Row>

            <Divider dashed />

            <Title level={5}>Danh sách sản phẩm mua:</Title>
            <List
              itemLayout="horizontal"
              dataSource={selectedOrder.parsed_products || []}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text>{item}</Text>}
                  />
                </List.Item>
              )}
            />

            <Divider dashed />
            <div style={{ textAlign: 'right' }}>
              <Title level={4} style={{ color: '#f5222d', margin: 0 }}>
                Tổng cộng: {Number(selectedOrder.total_price).toLocaleString('vi-VN')} đ
              </Title>
            </div>
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: 'center' }}>Không có dữ liệu!</div>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement;
