---
title: 什么时候分库分表，什么时候做冷热分离
category: topics
date: 2026-11-03
time: 20:03
tags: [分库分表, 分片, 分库, 分表, 表分区, 冷热分离, 归档, 数据库架构, sharding, partitioning, ShardingSphere, 社区, 技术面试]
summary: 口语「分库分表」常把两件事捆在一起：分表多解决单表过大带来的索引、DDL 与维护问题；分库多解决单机写、连接、容量与故障域。社区场景里时间倾斜的帖评与日志优先冷热归档，热集写顶满后再谈水平分片；Feed 读多写少先做读写分离。
tldr: 先分清分表、分库与冷热各自解决什么。帖评、埋点、审核日志定热窗口做冷热；私信、关系、高频互动热集写顶满再分库分片；分片键、全局 ID、跨片事务与 reshard 要提前算进成本。容量判断仍看本机热集、写利用率与恢复时间。
topic_type: tech
subjects: [web_cloud]
content_type: analysis
assistance: cursor
model: grok-bot
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

社区后端说到「库大了怎么办」，常听到两句：分库分表，或者冷热两张表。听着都像扩容，落地差很远。先把「分表」和「分库」拆开，再问疼在哪。

**分表**在口语里，多指同库表分区，或应用层拆出多张物理表。它主要缓解单表过大带来的索引变深、DDL 变慢、备份与维护变重，以及缺少时间/范围裁剪时的全表扫描。多数时候仍在同一数据库实例内。

**分库**则更常指两件事：按业务域垂直拆到不同库（用户一套、内容一套、消息一套）；或按分片键水平切到多个同构实例。它对准的是单机写吞吐、连接数、整机容量与故障域——私信持续涌入、关系边持续增长、某个圈子的互动计数把锁打红时，才会真正顶到这一层。

**冷热分离**按访问频率与保留策略切数据：热表/热库只留近期仍被高频读的行，冷表/冷库或对象存储承接历史。它与分库分表正交，常先做：热集变小后，再评估是否还要水平分片。读写分离只把读挪到从库，主库数据量与写上限都不会因此抬高。

顺序上通常是：治理索引与慢查询 →（读多）复制与缓存 → 冷热 / 时间分区 / 归档 → 垂直拆库 → 水平分片。量级上没有「单表过亿必须分库」这类硬阈值。PostgreSQL 给出的是相对机器内存的粗规则；Apache ShardingSphere 文档也写过单库数据量落在约 1TB 内相对好运维——两者都是文档启发式，具体以本机监控、备份体积与恢复时间为准。

## 二、事实层：术语与机制

### 2.1 分表与分库拆开说

#### 分表在解决什么

PostgreSQL 把 partitioning 定义为：把逻辑上的一张大表拆成更小的物理片段，用于查询裁剪、按段批量加载或删除，以及把少用数据迁到更慢介质；经验规则是表大小超过数据库服务器物理内存时，分区才更可能划算。[PostgreSQL Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)

MySQL 手册说明：分区把单表数据按规则分散到文件系统不同位置。MySQL 8.4 明确不支持按列做垂直分区，支持 RANGE / LIST / HASH / KEY 等水平分区形态。[MySQL Partitioning Overview](https://dev.mysql.com/doc/refman/8.4/en/partitioning-overview.html)

Apache ShardingSphere 在数据分片背景里区分 **table sharding（分表）** 与 **database sharding（分库）**：分表把数据拆到多张表，有助于把单表体量压到阈值以下，并为把部分分布式事务收敛到同库本地事务创造条件；分库则能分散 TPS，并配合多主从提升可用性。垂直分片按业务把表归到不同库；水平分片按字段规则把同行分散到多库或多表。[ShardingSphere: Sharding](https://shardingsphere.apache.org/document/current/en/features/sharding/)

应用层「按月建 `posts_202401` 这类物理表」也常被叫成分表。它与声明式分区目标相近，但缺少数据库分区约束时，规划器、DDL 与路由都要应用自己扛；PostgreSQL 提醒分区过多会拉长 planning、抬高内存。[PostgreSQL Partitioning Best Practices](https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITIONING-DECLARATIVE-BEST-PRACTICES)

**分表常见触发信号**

- 单表数据与索引持续膨胀，缓冲池命中变差，热查询本可带时间或范围谓词却扫到整表。
- 大表 DDL（加列、加索引、重建）窗口不可接受；按分区/物理表维护更可控。
- 备份、vacuum/optimize、恢复时间被「一张巨表」拖长，运维复杂度上升。
- 需要按段批量删除或迁走历史（按月 DROP/DETACH），避免大批 `DELETE`。

**分表常常不必上的情况**

- 表「看起来行数多」，但索引与查询已健康，DDL 与备份窗口可接受。
- 访问没有稳定的分区键或时间窗口，硬切只会制造数百张难维护的物理表。
- 真正瓶颈在单机写 TPS、连接数或整机容量——同库分表分散不了跨机写压力。

#### 分库在解决什么

Vitess 对 sharding 的定义是：把数据水平切到两台及以上数据库服务器；一个 shard 内通常仍有 primary 与 replicas，因此分片与复制彼此独立。文档还区分 horizontal sharding（拆、合 shard）与 vertical sharding（整表迁到另一 keyspace）。[Vitess Sharding](https://vitess.io/docs/25.0/reference/features/sharding/)

垂直拆库：用户、内容、消息、关系分到不同实例，降低发布与故障耦合。水平分库：按 `user_id` / `circle_id` 等键把同行路由到多套同构库，扩展写与容量。Citus 在 PostgreSQL 侧通过 `create_distributed_table`，按 distribution column 把行哈希到 worker，思路同类。[Citus Concepts](https://docs.citusdata.com/en/stable/get_started/concepts.html)

读写分离（如 MySQL Router：读走只读实例、写走可写实例）常与分库一起被提起，机制上只扩展读路径。[MySQL Router Read/Write Splitting](https://dev.mysql.com/doc/mysql-router/8.4/en/router-read-write-splitting.html)

**分库常见触发信号**

- 单主写 TPS、CPU、锁等待、redo/刷脏长期顶满；垂直加规格 ROI 变差或已近云厂商单实例上限。
- 连接数、发布窗口、多业务域抢同一实例，故障域过大。
- 热数据本身（做过冷热之后）仍超过单机舒适区；备份与恢复时间不可接受。
- 多租户 / 多圈子需要按 `tenant_id` / `circle_id` 隔离或按域扩容。

**分库常常不必上的情况**

- 主要矛盾是历史数据堆体积，热查询只打近窗口——优先冷热与分表/分区。
- 读多写少、主库写仍轻松——优先复制与缓存。
- QPS 与写压力都一般，只是表「看起来很大」。
- 查询强依赖跨表事务与复杂 JOIN，模型未改就上多库，会把复杂度提前几年。

### 2.2 冷热分离：形态、与分库分表的关系、边界

「冷热两张表」是最直白的应用层说法：热表承接在线读写，冷表或归档库承接低频历史。公开文档里，冷热常是一整条生命周期链路。

常见做法包括：

1. **同库热表 + 冷表**：业务写热表；按 `created_at` / `updated_at` 把过期行搬到 `*_archive`；历史查询显式打冷表或 `UNION`。
2. **时间分区 + DETACH/DROP**：热查询只碰最近分区；过期分区 `DETACH` 后备份、换表空间或删除。PostgreSQL 写明 DETACH 远快于大批 `DELETE`，并可把少用数据迁到更慢存储。[PostgreSQL Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
3. **热库 / 冷库**：在线实例只留热窗口；冷实例或只读副本承担审计与导出。
4. **表空间 / 引擎换介质**：阿里云 RDS PostgreSQL 用 `rds_oss` 表空间归档到 OSS；RDS MySQL 提供归档 DDL，归档后通常只读。[RDS PostgreSQL 数据归档](https://help.aliyun.com/zh/rds/apsaradb-rds-for-postgresql/data-archiving)、[RDS MySQL 冷数据归档至 OSS](https://help.aliyun.com/zh/rds/apsaradb-rds-for-mysql/rds-mysql-data-archiving-function)
5. **混合分区 / TTL 分层**：PolarDB MySQL 支持分区或整表归档到 OSS；ClickHouse、Lindorm 等按 TTL 把 part 转到冷盘。[PolarDB 冷数据归档](https://help.aliyun.com/zh/polardb/polardb-for-mysql/user-guide/cold-data-archiving)、[ClickHouse 冷热分层](https://help.aliyun.com/zh/clickhouse/user-guide/tiered-storage-of-hot-data-and-cold-data)、[Lindorm 冷热分离与 TTL](https://help.aliyun.com/zh/lindorm/user-guide/hot-and-cold-separation-and-ttl)
6. **出库到对象存储**：业务表只留热窗口；历史对象进 S3 等。S3 Intelligent-Tiering 默认约 30 天未访问进入 Infrequent，90 天进入 Archive Instant；更冷的异步归档层另有取回形态。[How S3 Intelligent-Tiering works](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering-overview.html)

**与分库分表的关系**：冷热按访问频率与保留策略切数据；分库分表按路由键或业务域切在线负载与故障域。二者正交。常见组合是先冷热缩小热集，再对热集做垂直拆库或水平分片；分片之后每个 shard 内仍可继续分区与 TTL，避免每个库再堆十年历史。

**何时做**：访问呈明显时间倾斜（帖评、消息、埋点、审核日志）；存储与备份成本已在账上可见；合规留存远长于在线 SLA。阿里云 RDS 文档把「数据量大 → 存储成本升高 → 冷数据进 OSS」写成产品动机，并给出相对 ESSD PL1 归档存储成本约下降 80% 的宣传数字——以厂商当期文档为准，落地前按实例规格与计费项复核。[RDS PostgreSQL 数据归档](https://help.aliyun.com/zh/rds/apsaradb-rds-for-postgresql/data-archiving)

**边界（跨冷热查询、回迁、一致性、成本）**

- **跨冷热查询**：热路径不应默认 `UNION` 全历史。历史检索要显式走冷表/冷库/对象存储，并接受更高延迟；Feed、详情接口需能带时间或业务键，否则剪不了枝。
- **回迁 / 解冻**：纠错、纠纷取证、状态回放会要求把冷数据写回热路径。归档后常为只读（如部分云归档 DDL），回迁要有独立流程与 SLA；没有解冻路径就不要把仍需频繁更新的行冷掉。
- **一致性**：迁移需要水位、幂等与对账，避免热冷重复或空洞；双写窗口要定义以谁为准。分区 DETACH/归档与应用搬表是不同一致性模型，运维手册要写清。
- **成本**：便宜的是低频存储与备份体积；换来的是链路复杂度、冷查延迟、偶发取回费用与人力。对象存储更冷层可能伴随取回等待或额外计费，不能默认「归档后仍零成本瞬时 SQL」。

社区帖子正文、评论楼层、埋点与审核流水，访问形态天然贴着「时间 + 热窗口」，是冷热的高概率适用面。

### 2.3 水平分片与中间件（事实）

水平分片把同一张逻辑表的行，按分片键分散到多个同构库。Vitess 举例：user keyspace 切成两个 shard 后，约一半用户在一边，单个用户数据仍在一个 shard；扩写靠拆 shard，扩读可先加 replica。[Vitess Sharding](https://vitess.io/docs/25.0/reference/features/sharding/)

Apache ShardingSphere 定位为在既有数据库之上提供分片、读写分离、分布式事务、数据迁移等增强能力，提供 ShardingSphere-JDBC（JDBC 层）与 ShardingSphere-Proxy（数据库协议代理）两种接入。[ShardingSphere Overview](https://shardingsphere.apache.org/document/current/en/overview/)。其分片概念包括逻辑表 / 实际表、分片键、分片算法、绑定表（相同分片规则的多表关联可避免笛卡尔积路由）等。[ShardingSphere Sharding Concepts](https://shardingsphere.apache.org/document/current/en/features/sharding/concept/)

中间件降低的是「手写路由与 SQL 改写」的工程量，不消除分片键选择、跨片事务、全局 ID 与 reshard 的模型成本。选型时读官方能力边界即可，下文不展开产品对比。

### 2.4 分片技术边界：键、全局 ID、跨片、扩容

**分片键**

分片键是水平切分所依据的字段。SQL 不含分片条件时，中间件或网关往往只能全路由，性能差。ShardingSphere 文档写明：无分片字段将执行 full routing。[ShardingSphere Sharding Concepts](https://shardingsphere.apache.org/document/current/en/features/sharding/concept/) Vitess 选 Primary Vindex 时要看最高 QPS 的 `WHERE`、列基数、同片 JOIN 与同片事务的数据局部性。[Vitess Resharding](https://vitess.io/docs/25.0/user-guides/configuration-advanced/resharding/)

社区侧常见对齐：私信按 `user_id`（或会话路由键）、圈子内容按 `circle_id`、关注边按粉丝一侧的键。单请求大多落单 shard 时收益才站得住。头部圈子 / 大 V 会造成热点片；全站热搜、跨圈排行、运营全站审核若必须扫全片，模型层要提前承认代价。

**全局唯一 ID**

分片后，各实际表上的数据库自增互不知晓，容易产生重复键。常见做法与代价：

- **UUID**：本地生成、冲突概率极低；作为聚簇索引时可能更随机，索引页分裂与存储开销需评估。
- **雪花类算法（Snowflake）**：趋势递增的长整型，含机器号与时间戳；依赖时钟与 worker 分配。ShardingSphere 内置 `SNOWFLAKE` 与 `UUID` 生成器，并提示用雪花值作分片键时需注意取模抖动配置。[ShardingSphere Key Generate Algorithm](https://shardingsphere.apache.org/document/current/en/user-manual/common-config/builtin-algorithm/keygen/)
- **号段 / sequence 服务**：Vitess 用 unsharded 的 sequence 表批量预留 ID，兼容近似 `auto_increment` 的插入体验；代价是依赖该序列所在关键路径的可用与缓存块大小。[Vitess Resharding](https://vitess.io/docs/25.0/user-guides/configuration-advanced/resharding/)
- **按库设置自增初始值与步长**：可缓解冲突，但运维规则重、扩展性差，ShardingSphere 文档也将其视为完整性不足的路径。[ShardingSphere Sharding Concepts](https://shardingsphere.apache.org/document/current/en/features/sharding/concept/)

**跨分片 JOIN 与事务**

跨库关联与跨库事务是分片后的核心难点。ShardingSphere 背景文档指出：跨库事务棘手；合理分表有助于把更多操作留在本地事务；无法避免跨库时，互联网场景更多采用最终一致的柔性事务，XA 强一致在高并发下常难满足性能预期。[ShardingSphere: Sharding](https://shardingsphere.apache.org/document/current/en/features/sharding/) 绑定表可降低同分片规则多表关联的笛卡尔积路由，前提是关联条件走分片键。[ShardingSphere Sharding Concepts](https://shardingsphere.apache.org/document/current/en/features/sharding/concept/)

社区里「一次请求拼用户、帖、关系、计数」若跨片，应在模型层拆读、异步聚合或冗余；中间件通常无法无损模拟单机 JOIN。

**扩容 / reshard / 迁移**

分片不是一次性拼图。Vitess 的 Reshard 在线拆片：准备序列与 Vindex → 创建目标 shard → 拷贝与校验 → 先切只读流量再切写 → 清理旧片。[Vitess Resharding](https://vitess.io/docs/25.0/user-guides/configuration-advanced/resharding/) ShardingSphere 数据迁移面向「单库迁到分片集群」：新集群作目标，经准备、存量迁移、增量同步（MySQL 解析 binlog，PostgreSQL 用逻辑复制）、一致性校验后切流；优点是对原集群影响可控，代价是阶段性冗余资源与全量搬迁。[ShardingSphere Data Migration](https://shardingsphere.apache.org/document/current/en/features/migration/)、[Migration Reference](https://shardingsphere.apache.org/document/current/en/reference/migration/)

规划分片时就要预留：键是否支持后续再切、回填与双写窗口、校验工具、以及切流时的只读或流量闸门。

## 三、结构分析：社区表上的触发条件

### 3.1 社区典型表与访问形态

内容社区里，首页 Feed 读请求往往远高于发帖与评论写入；三年前的旧楼很少再进热路径，备份体积却常被它们撑大。埋点表、审核操作日志时间倾斜更强：合规留存很长，线上 SLA 只覆盖最近若干周。这类表优先定热窗口，再做时间分区、冷热表或 TTL 归档。热窗口长度由产品访问曲线与合规要求决定；行数、QPS 以本机监控与备份体积为准。

私信与会话按会话追加写，用户主要读自己的盒子。消息体可先按时间分区（分表/分区），会话列表可缓存；活跃用户写入顶满单主后，再按 `user_id` 或会话路由键水平分库。关注、好友、圈子成员等边表查询通常带明确用户或圈子键：先垂直拆到关系库往往足够；边写与邻居查询顶满后再按 `user_id` / `circle_id` 分片。

点赞、收藏、计数的难点常在热点对象。计数异步化、缓存与限流通常先上；互动明细仍可按时间归档。热集写仍顶着单主时，再评估按用户或对象维度分片。用户资料、权限、配置行数相对可控、变更少，垂直拆到用户域即可。

Feed 与时间线多数读远多于写，组装依赖缓存或扇出。读路径优先读写分离与缓存。源帖、源评若因历史体量拖垮备份与索引，仍要回到冷热——从库再多，也搬不走主库里的旧行。时间线存储本身成为写瓶颈时，才轮到水平分片。

归纳：时间倾斜的帖评历史、埋点、审核日志，优先冷热与分表/分区；按用户或圈子聚合的会话、关系、高频互动，更可能因热集写顶满而分库分片；Feed 读多写少，优先复制与缓存。

### 3.2 症状与对症手段

备份和磁盘被旧帖评、埋点、审核日志撑开，热查询只扫近一段时间——冷热、时间分区、归档、TTL。索引很大、缓冲池命中差，活跃行却只占一小部分——优先归档或按时间分区；PostgreSQL 把分区剪枝列为缓解手段之一。单表 DDL 与维护窗口不可接受、需要按段丢弃历史——分表/分区。

合规要留存数年，Feed 与详情只需数周或数月热数据在线——热库短窗口，冷库或对象存储只读。Feed、详情读 QPS 高，发帖与互动写仍可接受——读写分离加缓存；主库数据量不会因此减少。

用户、内容、消息、关系挤在同一实例抢连接、锁与发布窗口——垂直分库。单主写 TPS、CPU、锁等待已经顶满，或热数据已离开单机舒适区——水平分库，且宜发生在冷热之后。多圈子要强隔离或按圈扩容时，分片键宜与 `circle_id` / 租户边界对齐。

### 3.3 冷热分离的适用与误用

适用面：访问呈时间倾斜的帖评流水、IM 消息、埋点、审核日志；存储与备份成本可见；需要整月封存或丢掉历史。团队规模有限时，归档与分区维护通常也比跨 shard 事务更好运维。

常见误用：热窗口未定义，接口仍全表扫；历史行仍需频繁回写却缺少解冻路径；迁移无水位与对账；把冷热当成写扩容手段——热集写满时，归档抬不起写上限。

### 3.4 分库与分表的适用与误用

**分表优先**：单表索引/DDL/按段生命周期是主矛盾，实例写能力仍够用。  
**分库优先**：单机写、连接、整机容量或故障域是主矛盾；垂直拆域或水平分片。  
**误用**：QPS 不高却上多库；分片键与访问路径错位；数百张无约束物理表；Feed 读多写少却跳过复制直接分片；跨片 JOIN/事务未改模型。

### 3.5 决策顺序

```text
社区库变大 / 变慢
  ├─ 历史帖评、埋点、审核日志拖垮备份和索引？
  │    └─ 定热窗口 → 时间分区/热冷表 → 归档
  ├─ 单表 DDL/索引/按段维护不可接受，写仍在单机舒适区？
  │    └─ 同库分表（声明式分区或受控物理表）
  ├─ Feed/详情读多、写仍轻松？
  │    └─ 读写分离 + 缓存
  ├─ 多域挤在同一实例？
  │    └─ 垂直分库
  └─ 热集写或热容量仍顶住？
       └─ 水平分库（user_id / circle_id）；预留全局 ID 与 reshard
```

### 3.6 组合用法

先冷热再分片：热库只留近一段时间的帖评与消息，分片只打热集。分区常作为冷热落地手段：按月 RANGE 后旧分区 DETACH，再迁 OSS 或归档库。垂直拆开用户、内容、消息、关系后，再只对消息或关系做 hash/range 分片，是 Vitess 常见路径之一。[Vitess Sharding Guidelines](https://vitess.io/docs/24.0/user-guides/vschema-guide/sharding-guidelines/)。每个 shard 内继续 TTL 与分区。

### 3.7 术语对齐要点

- 口语「分库分表」：先问对方指同库分表、垂直分库，还是水平分片。
- 「冷热两张表」：分层 / 归档，与分片正交，常先做。
- 主从读写：只扩读。
- 分片键贴 `user_id` / `circle_id`；全局 ID 用 UUID、雪花或号段，并接受各自代价。
- 反例：把分库分表当 KPI；读多写少且未定义热窗口就上分片；表看起来很大但热查询不带时间谓词。

分区仍是一张逻辑表、通常同实例，用于裁剪与按段迁走；分片是多实例路由，用于写与容量。Feed 是否分库，取决于瓶颈在读还是写。热窗口由在线 SLA、合规留存、查询能否带时间或业务键共同决定。读写分离不减少主库数据量，也不提高单主写上限。

## 四、外部研判

**判断：跟进。** 先把分表、分库、冷热的决策顺序写进容量规划；是否上 Vitess / Citus / ShardingSphere 等，另看热集指标、分片键与跨片查询审计。

读写分离、分区、冷热、水平分片若混叫「分库分表」，排期和风险会估错。帖评、埋点、审核日志这类时间倾斜表，冷热与时间分区是高概率正确的第一步；官方数据库与云厂商把归档做成一等能力，说明问题普遍且可产品化。水平分片是能力跃迁：收益是写与容量上限，成本是数据模型、全局 ID、跨片事务与 reshard。社区场景里，分片应对准会话、关系、高频互动等热集，不宜作为第一反应。

落地时可对每张候选大表写清：热窗口、查询是否总能带时间或 user/circle 键、备份占比、是否允许只读归档、是否已出现单表 DDL/索引痛点。能分区或归档的先做，用备份体积、缓冲池命中、P99 验证。只有热集指标仍逼近单主上限时，再评估分片键与中间件，并审计全站搜、运营报表、跨圈推荐等跨 shard 查询。

观望条件：库体量主要来自可删可归档的帖评与日志，产品侧尚未承诺热窗口——先补数据生命周期。  
不跟进的情形：把「分库分表」当绩效目标；业务仍是单机轻松撑住的读多写少系统，且热窗口从未定义。

## 五、信息来源与持续验证

资料截至 2026-11-03（北京时间）。主要来源：

1. [PostgreSQL: Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) — 分区动机、DETACH、最佳实践与「相对内存大小」经验规则  
2. [MySQL 8.4: Partitioning Overview](https://dev.mysql.com/doc/refman/8.4/en/partitioning-overview.html) — 分区语义；不支持垂直分区  
3. [Apache ShardingSphere: Sharding](https://shardingsphere.apache.org/document/current/en/features/sharding/) — 分库/分表、垂直/水平分片背景与跨库事务挑战  
4. [Apache ShardingSphere: Overview](https://shardingsphere.apache.org/document/current/en/overview/) — JDBC / Proxy 形态与能力概览  
5. [Apache ShardingSphere: Sharding Concepts](https://shardingsphere.apache.org/document/current/en/features/sharding/concept/) — 逻辑表、分片键、绑定表、分布式主键  
6. [Apache ShardingSphere: Key Generate Algorithm](https://shardingsphere.apache.org/document/current/en/user-manual/common-config/builtin-algorithm/keygen/) — UUID / SNOWFLAKE 内置生成器  
7. [Apache ShardingSphere: Data Migration](https://shardingsphere.apache.org/document/current/en/features/migration/)、[Migration Reference](https://shardingsphere.apache.org/document/current/en/reference/migration/) — 存量+增量迁移与切流  
8. [Vitess: Sharding](https://vitess.io/docs/25.0/reference/features/sharding/) — 水平/垂直分片；分片与复制正交  
9. [Vitess: Sharding Guidelines](https://vitess.io/docs/24.0/user-guides/vschema-guide/sharding-guidelines/) — MoveTables → Reshard 顺序  
10. [Vitess: Resharding](https://vitess.io/docs/25.0/user-guides/configuration-advanced/resharding/) — 序列、Vindex、在线拆片与切流  
11. [MySQL Router: Read/Write Splitting](https://dev.mysql.com/doc/mysql-router/8.4/en/router-read-write-splitting.html) — 读写分离机制  
12. [Citus: Concepts](https://docs.citusdata.com/en/stable/get_started/concepts.html) — PostgreSQL 分布式表概念  
13. [AWS S3: How Intelligent-Tiering works](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering-overview.html) — 对象存储冷热分层时间阈值  
14. [阿里云 RDS MySQL 冷数据归档至 OSS](https://help.aliyun.com/zh/rds/apsaradb-rds-for-mysql/rds-mysql-data-archiving-function)、[RDS PostgreSQL 数据归档](https://help.aliyun.com/zh/rds/apsaradb-rds-for-postgresql/data-archiving)、[PolarDB 冷数据归档](https://help.aliyun.com/zh/polardb/polardb-for-mysql/user-guide/cold-data-archiving)、[ClickHouse 冷热分层](https://help.aliyun.com/zh/clickhouse/user-guide/tiered-storage-of-hot-data-and-cold-data)、[Lindorm 冷热分离与 TTL](https://help.aliyun.com/zh/lindorm/user-guide/hot-and-cold-separation-and-ttl) — 国内云上冷热/归档产品形态

持续验证（会改变结论的缺项）：

- 若后续补上具体社区表量级、读写比与是否强事务，按上文决策顺序复核「先冷热/分表，还是已到分库」。  
- 云厂商归档「成本下降百分比」、可写/只读与取回计费随小版本变化，选型前再读目标引擎当期文档。  
- 若落地某一中间件（ShardingSphere / Vitess / Citus），按其当期文档复核分布式事务、绑定表/ Vindex 与迁移切流限制。  
- ShardingSphere 文档中的单库体量启发式（约 1TB）与 PostgreSQL「相对内存」规则，均需用本机备份、恢复与写利用率校准，不能当作跨业务硬阈值。
