-- 记录下单时终端：web=PC 扫码（url_qrcode），h5=手机跳转（url）

ALTER TABLE paid_orders ADD COLUMN client_mode TEXT;