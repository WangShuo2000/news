import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Clock, Globe, TrendingUp, Search, Filter, ExternalLink } from 'lucide-react';
import { gsap } from 'gsap';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
  link: string;
  thumbnail: string;
  pubDate: string;
}

const NewsWebsite = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const newsItemsRef = useRef<HTMLElement[]>([]);
  const headerRef = useRef(null);
  const loadingRef = useRef(null);
  const [scrollTriggerLoaded, setScrollTriggerLoaded] = useState(false);

  // 动态加载ScrollTrigger插件
  useEffect(() => {
    const loadScrollTrigger = async () => {
      try {
        // 动态导入ScrollTrigger
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);
        setScrollTriggerLoaded(true);
        console.log('ScrollTrigger加载成功');
        
      } catch (error) {
        console.warn('ScrollTrigger加载失败，使用备用方案:', error);
        // 如果动态导入失败，我们用原生的滚动监听作为备用方案
        setScrollTriggerLoaded(false);
      }
    };

    loadScrollTrigger();
  }, []);

  // 使用GSAP ScrollTrigger或备用滚动监听设置动画
  useEffect(() => {
    if (newsItemsRef.current.length > 0) {
      if (scrollTriggerLoaded && (window as any).ScrollTrigger) {
        // 使用ScrollTrigger
        newsItemsRef.current.forEach((item, index) => {
          if (item) {
            gsap.set(item, { 
              opacity: 0, 
              y: 60, 
              scale: 0.9,
              rotationX: 15
            });

            gsap.to(item, {
              opacity: 1,
              y: 0,
              scale: 1,
              rotationX: 0,
              duration: 1.2,
              ease: "power3.out",
              scrollTrigger: {
                trigger: item,
                start: "top 85%",
                end: "top 20%",
                toggleActions: "play none none reverse",
                markers: false,
              },
              delay: index * 0.1
            });

            item.addEventListener('mouseenter', () => {
              gsap.to(item, {
                scale: 1.02,
                duration: 0.3,
                ease: "power2.out"
              });
            });

            item.addEventListener('mouseleave', () => {
              gsap.to(item, {
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
              });
            });
          }
        });
      } else {
        // 备用方案：使用Intersection Observer
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry, entryIndex) => {
              if (entry.isIntersecting) {
                const element = entry.target as HTMLElement;
                gsap.fromTo(
                  element,
                  {
                    opacity: 0,
                    y: 60,
                    scale: 0.9,
                    rotationX: 15
                  },
                  {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotationX: 0,
                    duration: 1.2,
                    ease: "power3.out",
                    delay: entryIndex * 0.1
                  }
                );
                observer.unobserve(element);
              }
            });
          },
          {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
          }
        );

        newsItemsRef.current.forEach((item) => {
          if (item) {
            gsap.set(item, { 
              opacity: 0, 
              y: 60, 
              scale: 0.9,
              rotationX: 15
            });
            observer.observe(item);
          }
        });

        return () => {
          observer.disconnect();
        };
      }
    }

    return () => {
      // 清理ScrollTrigger实例
      if (scrollTriggerLoaded && (window as any).ScrollTrigger) {
        (window as any).ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
      }
    };
  }, [news, scrollTriggerLoaded]);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          ease: "power3.out",
          delay: 0.3
        }
      );
    }
  }, []);

  const fetchNews = async (reset = false) => {
    try {
      setLoading(true);
      
      const rssUrl = 'https://www.cnbc.com/id/100727362/device/rss/rss.html'
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`

      const response = await fetch(apiUrl);
      const res = await response.json();
      const articles = res.items.map((item: NewsItem) => ({
        title: item.title,
        description: item.description,
        url: item.link,
        urlToImage: item.thumbnail,
        publishedAt: item.pubDate,
        source: { name: item.source }
      }));
      
      if (reset) {
        setNews(articles);
      } else {
        setNews(prev => [...prev, ...articles]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('获取新闻失败:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    setNews([]);
    fetchNews(true);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 使用useMemo优化搜索过滤性能
  const filteredNews = useMemo(() => {
    if (!searchTerm.trim()) return news;
    return news.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [news, searchTerm]);

  // 防抖搜索输入
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(71,85,105,0.2),transparent_50%)] opacity-60"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.2),transparent_50%)] opacity-60"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(20,184,166,0.1),transparent_50%)] opacity-80"></div>
      
      {/* 浮动元素 */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-slate-200 to-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute top-40 right-10 w-24 h-24 bg-gradient-to-br from-blue-200 to-teal-200 rounded-full blur-2xl opacity-40 animate-bounce"></div>
      <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-gradient-to-br from-teal-200 to-slate-200 rounded-full blur-3xl opacity-25 animate-pulse"></div>

      {/* Header */}
      <header ref={headerRef} className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-black/5">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-blue-500/5 to-teal-500/5"></div>
        <div className="max-w-3xl mx-auto px-6 py-6 relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 via-blue-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-blue-600 to-teal-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <Globe className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                  摸鱼新闻
                </h1>
                <p className="text-sm text-gray-500 mt-1">发现世界，启发思考</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-white/50 rounded-full backdrop-blur-sm border border-white/20">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">实时更新</span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索新闻..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-6 py-4 bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all placeholder-gray-400 text-gray-700 shadow-lg shadow-black/5"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 via-blue-500/10 to-teal-500/10 rounded-2xl -z-10 blur-xl"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 relative z-10">
        <div className="space-y-8">
          {filteredNews.map((article, index) => (
            <article
              key={index}
              ref={el => { newsItemsRef.current[index] = el!; }}
              className="group relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 transition-all duration-500 overflow-hidden border border-white/20 hover:border-white/40 will-change-transform"
              style={{ perspective: '1000px' }}
            >
              {/* 卡片光泽效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                {article.urlToImage && (
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-500/20 via-blue-500/20 to-teal-500/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 shadow-lg">
                      热门
                    </div>
                  </div>
                )}
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100/80 px-4 py-2 rounded-full backdrop-blur-sm">
                        {article.source.name}
                      </span>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <span className="text-xs text-gray-500 font-medium">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 line-clamp-2 group-hover:text-blue-700 transition-colors duration-300 leading-tight">
                    {article.title}
                  </h2>
                  
                  {article.description && (
                    <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed text-base">
                      {article.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-700 via-blue-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group/btn"
                    >
                      <span>阅读全文</span>
                      <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div ref={loadingRef} className="flex justify-center py-16">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-t-teal-600 rounded-full animate-spin animate-reverse"></div>
              </div>
              <span className="text-gray-600 font-medium">精彩内容加载中...</span>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredNews.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Search className="w-16 h-16 text-slate-400" />
            </div>
            <p className="text-xl text-gray-500 mb-2">没有找到相关新闻</p>
            <p className="text-gray-400">试试其他关键词吧</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-slate-800 via-blue-900 to-teal-900 text-white py-16 mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>
        
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-300 to-blue-300 bg-clip-text text-transparent">
              摸鱼新闻
            </h3>
          </div>
          
          <p className="text-blue-200 mb-4">让每一次摸鱼都有所收获</p>
          <p className="text-blue-300/70 text-sm">© 2025 摸鱼新闻 - 发现世界，启发思考</p>
          
          <div className="mt-8 flex justify-center space-x-6">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse delay-400"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewsWebsite;