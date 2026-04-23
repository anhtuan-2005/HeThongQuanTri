import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Button, Card, message, Row, Col, Typography, Space, Spin, Select, Radio } from 'antd';
import api from '../../api/axios';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoryRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/categories')
        ]);
        
        setCategories(categoryRes.data);
        const productData = productRes.data;

        form.setFieldsValue({
          name: productData.name || '',
          price: productData.price || '',
          description: productData.description || '',
          image: productData.image || '',
          stock: productData.stock || 0,
          category_id: productData.category_id || null,
          status: productData.status || 'active'
        });
        setImageUrl(productData.image || '');
      } catch (_e) {
        void _e;
        message.error('Không tìm thấy dữ liệu hoặc lỗi kết nối!');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, form, navigate]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      await api.put(`/products/${id}`, values);
      message.success('Cập nhật sản phẩm thành công!');
      navigate('/'); 
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleValuesChange = (changedValues) => {
    if (changedValues.image !== undefined) {
      setImageUrl(changedValues.image);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <Spin size="large" tip="Đang tải dữ liệu sản phẩm..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12}>
          <Card 
            title={<Title level={4} style={{ margin: 0, color: '#faad14' }}>Cập Nhật Sản Phẩm #{id}</Title>}
            bordered={false} 
            className="shadow-sm"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={handleValuesChange}
            >
              <Form.Item
                name="name"
                label="Tên sản phẩm (*)"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
              >
                <Input size="large" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="Giá (VND) (*)"
                    rules={[{ required: true, message: 'Vui lòng nhập giá sản phẩm!' }]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }} 
                      size="large"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="stock"
                    label="Tồn kho (*)"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số lượng tồn kho!' },
                      { type: 'number', min: 0, message: 'Tồn kho không được nhỏ hơn 0!' }
                    ]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }}  
                      min={0}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="category_id"
                label="Danh mục Sản phẩm (*)"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
              >
                <Select placeholder="-- Chọn danh mục --" size="large">
                  {categories.map(c => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="status"
                label="Trạng thái (*)"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
              >
                <Radio.Group>
                  <Radio value="active">Đang bán</Radio>
                  <Radio value="inactive">Ngừng bán</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="description"
                label="Mô tả chi tiết (*)"
                rules={[
                  { required: true, message: 'Vui lòng nhập mô tả chi tiết!' },
                  { min: 10, message: 'Mô tả chi tiết phải có ít nhất 10 ký tự!' }
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item
                name="image"
                label="Link file Ảnh (URL)"
                rules={[
                  { required: true, message: 'Vui lòng nhập link ảnh sản phẩm!' },
                  {
                    validator: async (_, value) => {
                      const v = String(value || '').trim();
                      if (!v) return;
                      try {
                        const u = new URL(v);
                        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
                          throw new Error('bad_protocol');
                        }
                      } catch {
                        throw new Error('Vui lòng nhập URL hợp lệ (bắt đầu bằng http/https)!');
                      }
                    }
                  }
                ]}
              >
                <Input size="large" />
              </Form.Item>

              {imageUrl && (
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <img src={imageUrl} alt="Preview" style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid #d9d9d9', padding: '4px' }} />
                </div>
              )}

              <Form.Item style={{ marginBottom: 0 }}>
                <Space size="middle" style={{ display: 'flex' }}>
                  <Button type="primary" htmlType="submit" loading={saving} size="large" style={{ background: '#faad14', borderColor: '#faad14' }}>
                    {saving ? 'Đang cập nhật...' : 'Cập Nhật Lên Hệ Thống'}
                  </Button>
                  <Button size="large" onClick={() => navigate('/')}>
                    Hủy Bỏ
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductEdit;
