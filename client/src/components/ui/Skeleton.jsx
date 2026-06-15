import { motion } from 'framer-motion';

const Skeleton = ({ className, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-dark-800 ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
