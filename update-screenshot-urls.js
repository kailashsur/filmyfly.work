import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to update all movie screenshot URLs
 * FROM: img.iwabp.xyz
 * TO: image.linkmake.in
 */

const OLD_DOMAIN = 'img.iwabp.xyz';
const NEW_DOMAIN = 'image.linkmake.in';

async function updateScreenshotUrls() {
    console.log('\n🔄 Starting Screenshot URL Update...\n');
    console.log(`Replacing: ${OLD_DOMAIN}`);
    console.log(`With: ${NEW_DOMAIN}\n`);

    try {
        // Step 1: Count movies with old domain
        const moviesToUpdate = await prisma.movie.findMany({
            where: {
                screenshot: {
                    contains: OLD_DOMAIN
                }
            },
            select: {
                id: true,
                title: true,
                screenshot: true
            }
        });

        console.log(`📊 Found ${moviesToUpdate.length} movies with old domain\n`);

        if (moviesToUpdate.length === 0) {
            console.log('✅ No movies need updating. All done!');
            return;
        }

        // Step 2: Show preview of first 5 changes
        console.log('📋 Preview of changes (first 5):');
        console.log('─'.repeat(80));
        moviesToUpdate.slice(0, 5).forEach((movie, index) => {
            const newUrl = movie.screenshot?.replace(OLD_DOMAIN, NEW_DOMAIN);
            console.log(`\n${index + 1}. ${movie.title} (ID: ${movie.id})`);
            console.log(`   OLD: ${movie.screenshot}`);
            console.log(`   NEW: ${newUrl}`);
        });
        console.log('\n' + '─'.repeat(80));

        // Step 3: Ask for confirmation (in production, you might want to add a prompt)
        console.log(`\n⚠️  About to update ${moviesToUpdate.length} movies...`);
        console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 4: Perform the update
        console.log('🚀 Updating movies...\n');

        let successCount = 0;
        let errorCount = 0;

        for (const movie of moviesToUpdate) {
            try {
                const newScreenshot = movie.screenshot?.replace(OLD_DOMAIN, NEW_DOMAIN);

                await prisma.movie.update({
                    where: { id: movie.id },
                    data: { screenshot: newScreenshot }
                });

                successCount++;

                // Show progress every 10 movies
                if (successCount % 10 === 0) {
                    console.log(`✓ Updated ${successCount}/${moviesToUpdate.length} movies...`);
                }
            } catch (error) {
                errorCount++;
                console.error(`✗ Error updating movie ID ${movie.id}:`, error.message);
            }
        }

        // Step 5: Summary
        console.log('\n' + '═'.repeat(80));
        console.log('📈 UPDATE SUMMARY');
        console.log('═'.repeat(80));
        console.log(`✅ Successfully updated: ${successCount} movies`);
        console.log(`❌ Errors: ${errorCount} movies`);
        console.log(`📊 Total processed: ${moviesToUpdate.length} movies`);

        // Step 6: Verify the update
        const remainingOldUrls = await prisma.movie.count({
            where: {
                screenshot: {
                    contains: OLD_DOMAIN
                }
            }
        });

        const newUrls = await prisma.movie.count({
            where: {
                screenshot: {
                    contains: NEW_DOMAIN
                }
            }
        });

        console.log('\n📊 VERIFICATION:');
        console.log(`   Movies with old domain (${OLD_DOMAIN}): ${remainingOldUrls}`);
        console.log(`   Movies with new domain (${NEW_DOMAIN}): ${newUrls}`);

        if (remainingOldUrls === 0) {
            console.log('\n🎉 All screenshot URLs successfully updated!');
        } else {
            console.log(`\n⚠️  Warning: ${remainingOldUrls} movies still have the old domain.`);
        }

        // Step 7: Show some examples
        console.log('\n📸 Sample updated screenshots:');
        const samples = await prisma.movie.findMany({
            where: {
                screenshot: {
                    contains: NEW_DOMAIN
                }
            },
            select: {
                id: true,
                title: true,
                screenshot: true
            },
            take: 5
        });

        samples.forEach((movie, index) => {
            console.log(`\n${index + 1}. ${movie.title}`);
            console.log(`   ${movie.screenshot}`);
        });

        console.log('\n✅ Update complete!\n');

    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
updateScreenshotUrls()
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
